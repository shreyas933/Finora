"use client";

import { useEffect } from "react";

export function GlobalPermissionHandler() {
  useEffect(() => {
    const requestPermissions = async () => {
      // Check if running inside Capacitor
      if (typeof window !== "undefined" && (window as any).Capacitor) {
        try {
          const { registerPlugin } = await import("@capacitor/core");
          const UserIdBridge = registerPlugin<any>("UserIdBridge");

          // First check if already granted to avoid spamming
          const { granted } = await UserIdBridge.checkSmsPermission();

          if (!granted) {
            // Request permission directly
            await UserIdBridge.requestSmsPermission();
          }
        } catch (e) {
          console.error("GlobalPermissionHandler: Failed to handle SMS permissions", e);
        }
      } else {
        // Fallback for browser testing
        console.log("GlobalPermissionHandler: App is running in browser. SMS permission mocked as granted.");
      }
    };

    requestPermissions();
  }, []);

  return null; // This component handles logic only, no UI required.
}
