"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function GlobalPermissionHandler() {
  useEffect(() => {
    const requestPermissions = async () => {
      // Check if running inside native platform (Capacitor Android/iOS)
      if (Capacitor.isNativePlatform()) {
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

