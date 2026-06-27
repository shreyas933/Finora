"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Wallet, LogIn, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const authError = searchParams?.get("error");

  useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace("/dashboard");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        router.replace("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
        router.refresh();
        router.push("/dashboard");
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
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Unexpected error: " + (err?.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center p-6 bg-background relative font-sans">
      {/* Top Branding Section */}
      <div className="text-center mb-12 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-foreground tracking-widest mb-2">
          FINORA
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Your AI Personal CFO
        </p>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          Take control of your money
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          AI budgeting, smart payments, and goal tracking — all in one place.
        </p>

        <div className="flex justify-center gap-2 flex-wrap">
          {["AI Budget", "Smart Pay", "Goal Tracking"].map(pill => (
            <span key={pill} className="bg-muted text-foreground px-3.5 py-1.5 rounded-full text-xs font-medium">
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Dark Login Card */}
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-2xl flex flex-col gap-5 border border-border/50">
        {/* Floating Icon */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-inner">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Error / success banners */}
        {(authError === "auth_failed" || error) && (
          <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error || "Authentication failed. Please try again."}
          </div>
        )}
        {message && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm text-center">
            {message}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5 tracking-wider">EMAIL</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5 tracking-wider">PASSWORD</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoComplete="current-password"
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(129,1,0,0.3)]"
          >
            Login
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleSignUp}
            className="w-full h-12 rounded-xl border border-primary/50 bg-transparent text-foreground text-base font-semibold hover:bg-primary/10 disabled:opacity-50 transition-all"
          >
            Sign up
          </button>
        </div>

        <div className="text-center mt-3">
          <a href="#" className="text-primary text-sm hover:underline">forgot password?</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
