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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { registerPlugin } = await import("@capacitor/core");
        const UserIdBridge = registerPlugin<{ setUserId: (opts: { userId: string; accessToken?: string; apiBase?: string; isBudgetSet?: boolean }) => Promise<void> }>("UserIdBridge");

        if (UserIdBridge) {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          const apiBase = (origin.includes("localhost") || origin.includes("capacitor://"))
            ? "https://finora-fawn.vercel.app"
            : origin;
          const isBudgetSet = !!localStorage.getItem("finora_budgets");
          await UserIdBridge.setUserId({
            userId: session.user.id,
            accessToken: session.access_token,
            apiBase,
            isBudgetSet
          });
          console.log("[FINORA] UserId, ApiBase, & isBudgetSet synced to Android native layer:", session.user.id, apiBase, isBudgetSet);
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

    window.addEventListener("finora_budget_update", syncUserId);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("finora_budget_update", syncUserId);
    };
  }, []);

  return null;
}
