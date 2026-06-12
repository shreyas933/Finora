"use client";

import { Suspense, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Wallet, LogIn, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const authError = searchParams?.get("error");

  const handleLogin = useCallback(async () => {
    console.log("[FINORA] Login button clicked");
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        console.log("[FINORA] Login error:", authError.message);
        setError(authError.message);
      } else if (data.session) {
        console.log("[FINORA] Login success, navigating...");
        window.location.href = "/dashboard";
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err: any) {
      console.log("[FINORA] Unexpected error:", err);
      setError("Unexpected error: " + (err?.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  const handleSignUp = useCallback(async () => {
    console.log("[FINORA] SignUp button clicked");
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError, data } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        setError(authError.message);
      } else if (data.user?.identities?.length === 0) {
        setError("This email is already in use.");
      } else if (!data.session) {
        setMessage("Signup successful! Please check your email to verify your account.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError("Unexpected error: " + (err?.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "#0a0a1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 20,
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          background: "#111127",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
          padding: "32px 28px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              margin: "0 auto 16px",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(139,92,246,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet style={{ width: 28, height: 28, color: "#8b5cf6" }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            Welcome to FINORA
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Log in to manage your AI Personal CFO
          </p>
        </div>

        {/* Error / success banners */}
        {(authError === "auth_failed" || error) && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error || "Authentication failed. Please try again."}
          </div>
        )}
        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#34d399",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={isLoading}
            style={{
              width: "100%",
              height: 48,
              padding: "0 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              WebkitAppearance: "none",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isLoading}
            style={{
              width: "100%",
              height: 48,
              padding: "0 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              WebkitAppearance: "none",
            }}
          />
        </div>

        {/* Buttons — plain HTML buttons, NO form, NO abstractions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              WebkitAppearance: "none",
              touchAction: "manipulation",
            }}
          >
            <LogIn style={{ width: 18, height: 18 }} />
            Login
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleSignUp}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              WebkitAppearance: "none",
              touchAction: "manipulation",
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a1a", color: "#fff" }}>
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
