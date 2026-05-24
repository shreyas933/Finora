package com.finora.app

import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * UserIdBridge — Capacitor Plugin
 *
 * The FINORA web app (Next.js) calls this plugin right after the user signs in.
 * We store the Supabase userId in Android SharedPreferences so the
 * NotificationListenerService can find it later (it doesn't have access to the
 * WebView's localStorage).
 *
 * Usage from the web app (TypeScript):
 *   import { Plugins } from '@capacitor/core';
 *   const { UserIdBridge } = Plugins;
 *   await UserIdBridge.setUserId({ userId: session.user.id });
 */
@CapacitorPlugin(name = "UserIdBridge")
class UserIdBridgePlugin : Plugin() {

    @PluginMethod
    fun setUserId(call: PluginCall) {
        val userId = call.getString("userId")
        if (userId.isNullOrBlank()) {
            call.reject("userId is required")
            return
        }

        context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("user_id", userId)
            .apply()

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun getUserId(call: PluginCall) {
        val userId = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
            .getString("user_id", null)
        call.resolve(JSObject().put("userId", userId))
    }
}
