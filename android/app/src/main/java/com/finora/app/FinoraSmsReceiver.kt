package com.finora.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsMessage
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * FINORA Real-time SMS Receiver
 *
 * Listens for incoming SMS broadcasts (Telephony.SMS_RECEIVED).
 * Rebuilds the SMS message, filters out personal/promotional text,
 * retrieves the logged-in Supabase user_id, and pipes the text to
 * our Gemini-powered transactions parser.
 */
class FinoraSmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "FinoraSmsReceiver"
        private const val API_BASE = "https://finora-fawn.vercel.app"
    }

    private val httpClient = OkHttpClient()

    private fun getApiBase(context: Context): String {
        val prefs = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
        val storedBase = prefs.getString("api_base", null)
        if (!storedBase.isNullOrBlank()) {
            return if (storedBase.endsWith("/")) storedBase.substring(0, storedBase.length - 1) else storedBase
        }
        return API_BASE
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return
        if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return

        val pendingResult = goAsync()

        Thread {
            try {
                val bundle = intent.extras ?: return@Thread
                val pdus = bundle.get("pdus") as? Array<*> ?: return@Thread
                val format = bundle.getString("format")

                val messageMap = mutableMapOf<String, StringBuilder>()

                for (pdu in pdus) {
                    val sms = SmsMessage.createFromPdu(pdu as ByteArray, format)
                    val sender = sms.originatingAddress ?: "Unknown"
                    val body = sms.messageBody ?: ""

                    if (!messageMap.containsKey(sender)) {
                        messageMap[sender] = StringBuilder()
                    }
                    messageMap[sender]?.append(body)
                }

                for ((sender, bodyBuilder) in messageMap) {
                    val rawBody = bodyBuilder.toString().trim()
                    Log.d(TAG, "Intercepted SMS from $sender: $rawBody")

                    // Filter out non-financial transactions
                    val lowerBody = rawBody.lowercase()
                    val isFinancial = lowerBody.contains("debited") || 
                            lowerBody.contains("credited") || 
                            lowerBody.contains("withdrawn") || 
                            lowerBody.contains("spent") || 
                            lowerBody.contains("paid") || 
                            lowerBody.contains("sent") || 
                            lowerBody.contains("received") || 
                            lowerBody.contains("transfer") || 
                            lowerBody.contains("upi") || 
                            lowerBody.contains("vpa") ||
                            lowerBody.contains("rs.") ||
                            lowerBody.contains("inr")

                    if (!isFinancial) {
                        Log.d(TAG, "SMS is not a financial transaction. Ignoring.")
                        continue
                    }

                    Log.d(TAG, "Financial SMS detected. Sending to FINORA AI parser.")
                    sendToFinoraSync(context, rawBody)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error handling incoming SMS: ${e.message}", e)
            } finally {
                pendingResult.finish()
            }
        }.start()
    }

    private fun sendToFinoraSync(context: Context, rawSmsText: String) {
        val base = getApiBase(context)
        val categorizeUrl = "$base/api/sync/categorize"
        val ingestUrl = "$base/api/sync/ingest"

        try {
            // Step 1: call /api/sync/categorize (AI parses the SMS text)
            val categorizeBody = JSONObject().put("raw", rawSmsText).toString()
            val categorizeRequest = Request.Builder()
                .url(categorizeUrl)
                .post(categorizeBody.toRequestBody("application/json".toMediaType()))
                .build()

            val categorizeResponse = httpClient.newCall(categorizeRequest).execute()
            val body = categorizeResponse.body?.string() ?: ""
            if (!categorizeResponse.isSuccessful) {
                Log.e(TAG, "Categorize API error ${categorizeResponse.code}: $body")
                categorizeResponse.close()
                return
            }
            categorizeResponse.close()

            val json = JSONObject(body)
            val transaction = json.getJSONObject("transaction")
            Log.d(TAG, "AI parsed SMS: ${transaction.getString("name")} — ${transaction.getDouble("amount")}")

            // Step 2: call /api/sync/ingest (writes to Supabase)
            val prefs = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
            val userId = prefs.getString("user_id", null)
            val token = prefs.getString("access_token", null)

            if (userId == null) {
                Log.w(TAG, "No userId stored yet — user hasn't logged in via the app")
                return
            }

            val ingestPayload = JSONObject()
                .put("userId", userId)
                .put("transaction", transaction)
                .toString()

            val requestBuilder = Request.Builder()
                .url(ingestUrl)
                .post(ingestPayload.toRequestBody("application/json".toMediaType()))

            if (!token.isNullOrBlank()) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }

            val ingestRequest = requestBuilder.build()

            val ingestResponse = httpClient.newCall(ingestRequest).execute()
            val ingestBodyString = ingestResponse.body?.string() ?: ""
            if (ingestResponse.isSuccessful) {
                Log.d(TAG, "✓ SMS Transaction logged to Supabase: ${transaction.getString("name")}")
                val amount = transaction.optDouble("amount", 0.0)
                val merchant = transaction.optString("name", "Unknown Merchant")
                val category = transaction.optString("category", "General")
                FinoraNotificationHelper.showNotification(
                    context,
                    "Transaction Logged ⚡",
                    "Saved ₹$amount to $merchant ($category) successfully."
                )
            } else {
                Log.e(TAG, "Ingest failed ${ingestResponse.code}: $ingestBodyString")
            }
            ingestResponse.close()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS to Finora: ${e.message}", e)
        }
    }
}
