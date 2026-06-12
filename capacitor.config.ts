import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finora.app",
  appName: "FINORA",
  // ─── Key: point the WebView at the live Next.js server
  // During dev:  http://192.168.1.101:3000  (your PC's LAN IP)
  // Production:  https://finora.vercel.app   (deployed URL)
  server: {
    url: "http://127.0.0.1:3000",
    cleartext: true, // allow HTTP (not just HTTPS) for local dev
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
  plugins: {
    // No extra plugin config needed for notification listener
    // (it's pure native code)
  },
};

export default config;
