"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * CapacitorUserBridge
 *
 * When running inside the Android Capacitor WebView, this component
 * calls the native UserIdBridgePlugin right after Supabase login so the
 * background NotificationListenerService can look up the userId when it
 * needs to ingest a Google Pay transaction.
 *
 * Does nothing when running in a normal browser (Capacitor APIs are absent).
 */
export function CapacitorUserBridge() {
  const supabase = createClient();

  useEffect(() => {
    const syncUserId = async () => {
      // Only run inside the Capacitor WebView (Capacitor object is injected by native)
      if (typeof window === "undefined" || !(window as any).Capacitor) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { registerPlugin } = await import("@capacitor/core");
        const UserIdBridge = registerPlugin<{ setUserId: (opts: { userId: string }) => Promise<void> }>("UserIdBridge");

        if (UserIdBridge) {
          await UserIdBridge.setUserId({ userId: user.id });
          console.log("[FINORA] UserId synced to Android native layer:", user.id);
        }
      } catch (err) {
        // Non-fatal — the notification listener just won't ingest until next launch
        console.warn("[FINORA] CapacitorUserBridge error:", err);
      }
    };

    syncUserId();

    // Also re-sync on auth state changes (e.g., after sign-in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user?.id) {
        syncUserId();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
