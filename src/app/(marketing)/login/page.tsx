"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Wallet, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const googleAuthEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

  const searchParams = useSearchParams();
  const authError = searchParams?.get("error");

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent, isSignUp = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error, data } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (
      isSignUp &&
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      setError("This email is already in use.");
    } else if (isSignUp) {
      setMessage(
        "Success! Check your email to verify your account, or just login if verification is disabled.",
      );
    } else {
      // Login successful, route directly to dashboard
      window.location.href = "/dashboard";
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!googleAuthEnabled) {
      setError(
        "Google sign-in is not configured yet. Use email login or enable the Google provider in Supabase.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[128px] pointer-events-none" />

      <Card className="w-full max-w-md border-primary/20 shadow-2xl relative z-10 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to FINORA
          </CardTitle>
          <CardDescription className="text-base">
            Log in to manage your AI Personal CFO
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {authError === "auth_failed" && (
            <div className="p-3 text-sm rounded bg-red-500/10 text-red-500 border border-red-500/20 text-center">
              Authentication failed. Please try again.
            </div>
          )}
          {error && (
            <div className="p-3 text-sm rounded bg-red-500/10 text-red-500 border border-red-500/20 text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 text-sm rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-center">
              {message}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium relative hover:bg-white/5 border-white/10"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form
            onSubmit={(e) => handleEmailLogin(e, false)}
            className="space-y-4"
            autoComplete="on"
          >
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 bg-background border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-12 bg-background border-white/10"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 h-12 text-base font-medium"
                disabled={isLoading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 h-12 text-base font-medium"
                disabled={isLoading}
                onClick={(e) => handleEmailLogin(e, true)}
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/40 p-4">
          <p className="text-sm text-muted-foreground">
            Make sure to configure real Google Auth in your Supabase dashboard
            later.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
