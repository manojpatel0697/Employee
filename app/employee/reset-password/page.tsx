"use client";

/**
 * /employee/reset-password
 *
 * Two modes:
 * 1. REQUEST mode  — employee enters their email → Supabase sends a reset link
 * 2. UPDATE mode   — employee arrived via the reset link in their email
 *
 * Supabase sends the user back to this URL with a hash fragment:
 *   /employee/reset-password#access_token=...&type=recovery
 *
 * The Supabase JS client picks that up automatically and fires a
 * PASSWORD_RECOVERY auth event. We listen for that event to switch
 * into UPDATE mode reliably (the hash is consumed by the client before
 * a useEffect can read it, which is why checking window.location.hash
 * directly is unreliable).
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import TheramifyLogo from "@/components/ui/TheramifyLogo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

type Mode = "request" | "update" | "done" | "error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Listen for the PASSWORD_RECOVERY event — fired when Supabase
    // processes the #access_token from the reset link in the email.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setMode("update");
        }
      }
    );

    // Also check the hash directly as a fallback (handles page reload edge case)
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("type=invite")) {
      setMode("update");
    }

    return () => subscription.unsubscribe();
  }, []);

  // ── REQUEST: send reset email ─────────────────────────────────────
  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        // Supabase will only honour redirect URLs that are whitelisted
        // in your Supabase dashboard → Authentication → URL Configuration.
        // Make sure http://localhost:3000/** is added there.
        redirectTo: `${window.location.origin}/employee/reset-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      console.error("Reset error:", resetError.message);
      setError(
        resetError.message.includes("not allowed")
          ? "This email is not registered. Check the address and try again."
          : "Could not send reset email. Try again later."
      );
      return;
    }

    setMode("done");
  }

  // ── UPDATE: set new password ──────────────────────────────────────
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message ?? "Failed to update password. The link may have expired — request a new one.");
      return;
    }

    router.push("/employee/login?passwordSet=1");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <TheramifyLogo size={72} />
        </div>

        {/* ── REQUEST mode ── */}
        {mode === "request" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Reset password
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your work email and we&apos;ll send you a password reset
              link.
            </p>

            <form onSubmit={handleRequest} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent"
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
                {loading ? "Sending…" : "Send reset link"}
              </Button>

              <p className="text-center text-sm text-gray-500">
                <a
                  href="/employee/login"
                  className="text-indigo-600 hover:underline"
                >
                  Back to sign in
                </a>
              </p>
            </form>
          </>
        )}

        {/* ── UPDATE mode (arrived via reset link) ── */}
        {mode === "update" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Set new password
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Choose a strong password — at least 8 characters.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  maxLength={128}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent"
                />
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? level <= 2
                              ? "bg-red-400"
                              : level === 3
                              ? "bg-yellow-400"
                              : "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {password.length < 6
                      ? "Too short"
                      : password.length < 9
                      ? "Weak"
                      : password.length < 12
                      ? "Good"
                      : "Strong"}
                  </p>
                </div>
              )}

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
                {loading ? "Saving…" : "Set password"}
              </Button>
            </form>
          </>
        )}

        {/* ── DONE mode: email sent ── */}
        {mode === "done" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">
              ✉️
            </div>
            <h1 className="text-xl font-bold text-gray-900">Check your inbox</h1>
            <p className="text-sm text-gray-500">
              We sent a password reset link to{" "}
              <span className="font-medium text-gray-700">{email}</span>.
              Click the link in that email to set your password.
            </p>
            <p className="text-xs text-gray-400">
              Check your spam folder if you don&apos;t see it.{" "}
              <button
                onClick={() => { setMode("request"); setError(null); }}
                className="text-indigo-600 hover:underline"
              >
                Send again
              </button>
            </p>
          </div>
        )}
      </Card>
    </main>
  );
}
