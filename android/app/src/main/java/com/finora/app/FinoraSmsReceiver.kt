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
import java.io.IOException

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

        // ─── Server URL ───────────────────────────────────────────────────────
        // Dev:  your PC's LAN IP while running `npm run dev`
        // Prod: your deployed Vercel/Railway URL
        private const val API_BASE = "http://10.55.128.169:3000"
    }

    private val httpClient = OkHttpClient()

    private fun getApiBase(context: Context): String {
        val prefs = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
        val storedBase = prefs.getString("api_base", null)
        if (!storedBase.isNullOrBlank()) {
            // Strip trailing slash if present to avoid double-slashes
            return if (storedBase.endsWith("/")) storedBase.substring(0, storedBase.length - 1) else storedBase
        }
        return API_BASE
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return
        if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return

        try {
            val bundle = intent.extras ?: return
            val pdus = bundle.get("pdus") as? Array<*> ?: return
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
                        lowerBody.contains("vpa")

                if (!isFinancial) {
                    Log.d(TAG, "SMS is not a financial transaction. Ignoring.")
                    continue
                }

                Log.d(TAG, "Financial SMS detected. Sending to FINORA AI parser.")
                sendToFinora(context, rawBody)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling incoming SMS: ${e.message}", e)
        }
    }

    private fun sendToFinora(context: Context, rawSmsText: String) {
        val base = getApiBase(context)
        val categorizeUrl = "$base/api/sync/categorize"
        val ingestUrl = "$base/api/sync/ingest"

        // Step 1: call /api/sync/categorize (AI parses the SMS text)
        val categorizeBody = JSONObject().put("raw", rawSmsText).toString()
        val categorizeRequest = Request.Builder()
            .url(categorizeUrl)
            .post(categorizeBody.toRequestBody("application/json".toMediaType()))
            .build()

        httpClient.newCall(categorizeRequest).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Categorize API failed: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: return
                if (!response.isSuccessful) {
                    Log.e(TAG, "Categorize API error ${response.code}: $body")
                    return
                }

                try {
                    val json       = JSONObject(body)
                    val transaction = json.getJSONObject("transaction")
                    Log.d(TAG, "AI parsed SMS: ${transaction.getString("name")} — ${transaction.getDouble("amount")}")

                    // Step 2: call /api/sync/ingest (writes to Supabase)
                    // Read the active Supabase userId from SharedPreferences
                    val prefs  = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
                    val userId = prefs.getString("user_id", null)

                    if (userId == null) {
                        Log.w(TAG, "No userId stored yet — user hasn't logged in via the app")
                        return
                    }

                    val ingestPayload = JSONObject()
                        .put("userId", userId)
                        .put("transaction", transaction)
                        .toString()

                    val ingestRequest = Request.Builder()
                        .url(ingestUrl)
                        .post(ingestPayload.toRequestBody("application/json".toMediaType()))
                        .build()

                    httpClient.newCall(ingestRequest).enqueue(object : Callback {
                        override fun onFailure(call: Call, e: IOException) {
                            Log.e(TAG, "Ingest API failed: ${e.message}")
                        }
                        override fun onResponse(call: Call, response: Response) {
                            if (response.isSuccessful) {
                                Log.d(TAG, "✓ SMS Transaction logged to Supabase: ${transaction.getString("name")}")
                            } else {
                                Log.e(TAG, "Ingest failed ${response.code}: ${response.body?.string()}")
                            }
                        }
                    })
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse AI SMS response: ${e.message}")
                }
            }
        })
    }
}
