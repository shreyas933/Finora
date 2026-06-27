package com.finora.app

import android.content.ComponentName
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

/**
 * FINORA Notification Listener
 *
 * Runs silently in the background. When a Google Pay (or bank/UPI) notification
 * arrives, it extracts the text and ships it to the FINORA AI categorization
 * endpoint, which uses Gemini to parse the merchant/amount/category and then
 * stores the transaction directly in Supabase.
 *
 * Permissions required (declared in AndroidManifest.xml):
 *   android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
 * The user must also grant access in:
 *   Settings → Notifications → Notification Access → FINORA
 */
class FinoraNotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "FinoraNotifListener"

        // ─── Server URL ───────────────────────────────────────────────────────
        // Dev:  your PC's LAN IP while running `npm run dev`
        // Prod: your deployed Vercel/Railway URL
        private const val API_BASE = "https://finora-fawn.vercel.app"

        // ─── Supabase (for auth token so ingest can identify the user) ────────
        // These are read-only anon keys — safe to embed in the APK
        private const val SUPABASE_URL      = "https://tqmkivmfjarmgqihvbtm.supabase.co"
        private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y"

        // ─── Packages whose notifications contain payment info ────────────────
        private val PAYMENT_PACKAGES = setOf(
            "com.google.android.apps.nbu.paisa.user",  // Google Pay (India)
            "com.google.android.apps.walletnfcrel",    // Google Wallet
            "net.one97.paytm",                          // Paytm
            "in.org.npci.upiapp",                       // BHIM UPI
            "com.phonepe.app",                          // PhonePe
            "in.amazon.mShop.android.shopping",        // Amazon Pay
        )

        // Bank notification packages (sends UPI credit/debit alerts)
        private val BANK_PACKAGES = setOf(
            "com.sbi.lotusintouch",          // SBI
            "com.snapwork.hdfc",             // HDFC
            "com.csam.icici.bank.imobile",  // ICICI
            "com.axis.mobile",               // Axis Bank
            "com.kotak.mobile.kotak811",    // Kotak
        )
    }

    private val httpClient = OkHttpClient()

    private fun getApiBase(): String {
        val prefs = getSharedPreferences("finora_prefs", MODE_PRIVATE)
        val storedBase = prefs.getString("api_base", null)
        if (!storedBase.isNullOrBlank() && !storedBase.contains("finora-wine.vercel.app")) {
            // Strip trailing slash if present to avoid double-slashes
            return if (storedBase.endsWith("/")) storedBase.substring(0, storedBase.length - 1) else storedBase
        }
        return API_BASE
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "FINORA notification listener started")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return

        val pkg = sbn.packageName ?: return
        if (pkg !in PAYMENT_PACKAGES && pkg !in BANK_PACKAGES) return

        // Extract notification text
        val extras = sbn.notification?.extras ?: return
        val title = extras.getString("android.title") ?: ""
        val text  = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

        // Use the richest text available
        val rawText = when {
            bigText.isNotBlank() -> "$title $bigText"
            text.isNotBlank()    -> "$title $text"
            else                 -> return
        }.trim()

        Log.d(TAG, "Intercepted payment notification from $pkg: $rawText")

        // Must look like a payment (filter out promotional/other noise)
        val lowerText = rawText.lowercase()
        val isPaymentNotif = lowerText.any { _ -> true } &&
            (lowerText.contains("paid") || lowerText.contains("debited") ||
             lowerText.contains("sent") || lowerText.contains("upi") ||
             lowerText.contains("credited") || lowerText.contains("received"))

        if (!isPaymentNotif) return

        Log.d(TAG, "Sending to FINORA AI: $rawText")
        sendToFinora(rawText)
    }

    private fun sendToFinora(rawNotificationText: String) {
        val base = getApiBase()
        val categorizeUrl = "$base/api/sync/categorize"
        val ingestUrl = "$base/api/sync/ingest"

        // Step 1: call /api/sync/categorize (AI parses the notification)
        val categorizeBody = JSONObject().put("raw", rawNotificationText).toString()
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
                    Log.d(TAG, "AI parsed: ${transaction.getString("name")} — ${transaction.getDouble("amount")}")

                    // Step 2: call /api/sync/ingest (writes to Supabase)
                    // We need the userId — stored in SharedPreferences after web login
                    val prefs  = getSharedPreferences("finora_prefs", MODE_PRIVATE)
                    val userId = prefs.getString("user_id", null)
                    val token  = prefs.getString("access_token", null)
                    val isBudgetSet = prefs.getBoolean("is_budget_set", false)

                    if (userId == null) {
                        Log.w(TAG, "No userId stored yet — user hasn't logged in via the app")
                        return
                    }

                    val ingestPayload = JSONObject()
                        .put("userId", userId)
                        .put("transaction", transaction)
                        .put("isBudgetSet", isBudgetSet)
                        .toString()

                    val requestBuilder = Request.Builder()
                        .url(ingestUrl)
                        .post(ingestPayload.toRequestBody("application/json".toMediaType()))

                    if (!token.isNullOrBlank()) {
                        requestBuilder.addHeader("Authorization", "Bearer $token")
                    }

                    val ingestRequest = requestBuilder.build()

                    httpClient.newCall(ingestRequest).enqueue(object : Callback {
                        override fun onFailure(call: Call, e: IOException) {
                            Log.e(TAG, "Ingest API failed: ${e.message}")
                        }
                        override fun onResponse(call: Call, response: Response) {
                            if (response.isSuccessful) {
                                Log.d(TAG, "✓ Transaction logged to FINORA: ${transaction.getString("name")}")
                                val amount = transaction.optDouble("amount", 0.0)
                                val merchant = transaction.optString("name", "Unknown Merchant")
                                val category = transaction.optString("category", "General")
                                FinoraNotificationHelper.showNotification(
                                    applicationContext,
                                    "Transaction Logged ⚡",
                                    "Saved ₹$amount to $merchant ($category) successfully."
                                )
                            } else {
                                Log.e(TAG, "Ingest failed ${response.code}: ${response.body?.string()}")
                            }
                        }
                    })
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to process AI response: ${e.message}")
                }
            }
        })
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Listener connected — watching for Google Pay notifications")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "Listener disconnected")
        // Re-request rebind
        requestRebind(ComponentName(this, FinoraNotificationListener::class.java))
    }
}
