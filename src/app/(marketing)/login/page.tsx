"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Wallet, Loader2 } from "lucide-react";
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
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
    <div className="flex flex-col min-h-screen w-full items-center justify-center p-6 gradient-mesh relative font-sans text-foreground bg-[#F0F2F5]">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-[40vw] h-[40vw] bg-primary/[0.1] rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-blue-500/[0.08] rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Branding Section */}
      <div className="text-center mb-10 w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#84cc16"/>
              <path d="M2 17L12 22L22 17" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-widest">
            FINORA
          </h1>
        </div>
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
            <span key={pill} className="bg-secondary text-foreground px-3.5 py-1.5 rounded-full text-xs font-medium border border-black/[0.04]">
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-card flex flex-col gap-5 border border-black/[0.06] relative z-10">
        {/* Floating Icon */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Error / success banners */}
        {(authError === "auth_failed" || error) && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-sm text-center border border-red-200">
            {error || "Authentication failed. Please try again."}
          </div>
        )}
        {message && (
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-sm text-center border border-emerald-200">
            {message}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5 tracking-wider uppercase">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl border border-black/[0.08] bg-secondary text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5 tracking-wider uppercase">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoComplete="current-password"
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl border border-black/[0.08] bg-secondary text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(163,230,53,0.3)] active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Login"}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleSignUp}
            className="w-full h-12 rounded-xl border border-black/[0.08] bg-transparent text-foreground text-base font-semibold hover:bg-black/[0.04] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            Sign up
          </button>
        </div>

        <div className="text-center mt-3">
          <a href="#" className="text-primary-foreground text-sm hover:underline font-medium">forgot password?</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center gradient-mesh text-foreground bg-[#F0F2F5]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
