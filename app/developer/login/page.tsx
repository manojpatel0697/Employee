"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import TheramifyLogo from "@/components/ui/TheramifyLogo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export default function DeveloperLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "Email address is required.";
    if (!isValidEmail(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    // Server-side rate-limited login
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (res.status === 429) {
        setError("Too many login attempts. Please wait 15 minutes.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }

      // Sign in on the client to set the auth cookie
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }

      // Verify this account has the developer role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .maybeSingle() as { data: { role: string } | null };

      if (!profile || profile.role !== "developer") {
        await supabase.auth.signOut();
        setError("Access denied. This portal is for developers only.");
        setLoading(false);
        return;
      }

      router.push("/developer");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setLoading(true);

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (authError) {
      setError("Could not send magic link. Try again later.");
      return;
    }

    setMagicLinkSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <TheramifyLogo size={72} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Developer Login
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to access the PRD &amp; project status portal.
        </p>

        {magicLinkSent ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            Magic link sent! Check your inbox and click the link to log in.
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="dev-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="dev-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@theramify.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="dev-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="dev-password"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p role="alert" aria-live="polite" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-3 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={loading}
              className="w-full"
              onClick={handleMagicLink}
            >
              Send magic link
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
