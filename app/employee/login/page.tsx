"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import TheramifyLogo from "@/components/ui/TheramifyLogo";

// Basic client-side email validation (server re-validates anyway)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export default function EmployeeLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Client-side validation before hitting the network
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

    // Route through the rate-limited server-side login endpoint
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (res.status === 429) {
        setError("Too many login attempts. Please wait 15 minutes.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Sign-in failed. Check your credentials.");
        setLoading(false);
        return;
      }

      // Sign in on the client too so Supabase sets the auth cookie
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

      router.push("/employee/dashboard");
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
      // Generic message — don't reveal if the email exists
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Employee Login</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to access your lead pipeline.
        </p>

        {magicLinkSent ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            Magic link sent! Check your inbox and click the link to log in.
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
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
