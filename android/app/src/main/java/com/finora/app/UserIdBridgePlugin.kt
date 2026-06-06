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
        val apiBase = call.getString("apiBase")
        if (userId.isNullOrBlank()) {
            call.reject("userId is required")
            return
        }

        val editor = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE).edit()
        editor.putString("user_id", userId)
        if (!apiBase.isNullOrBlank()) {
            editor.putString("api_base", apiBase)
        }
        editor.apply()

        call.resolve(JSObject().put("success", true))
    }

    @PluginMethod
    fun getUserId(call: PluginCall) {
        val userId = context.getSharedPreferences("finora_prefs", Context.MODE_PRIVATE)
            .getString("user_id", null)
        call.resolve(JSObject().put("userId", userId))
    }

    @PluginMethod
    fun checkSmsPermission(call: PluginCall) {
        val hasPermission = androidx.core.content.ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.RECEIVE_SMS
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        
        call.resolve(JSObject().put("granted", hasPermission))
    }

    @PluginMethod
    fun requestSmsPermission(call: PluginCall) {
        val activity = bridge.activity
        if (activity == null) {
            call.reject("Activity not available")
            return
        }

        val hasPermission = androidx.core.content.ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.RECEIVE_SMS
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            call.resolve(JSObject().put("granted", true))
            return
        }

        androidx.core.app.ActivityCompat.requestPermissions(
            activity,
            arrayOf(android.Manifest.permission.RECEIVE_SMS),
            102
        )

        call.resolve(JSObject().put("requested", true))
    }
}
