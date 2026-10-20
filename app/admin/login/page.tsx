"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TheramifyLogo from "@/components/ui/TheramifyLogo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

/**
 * /admin/login — Admin secret-key entry page.
 *
 * The admin never sees the key in a URL on the homepage.
 * They type it here; we redirect to /admin/[key] which the
 * middleware + server component validate server-side.
 * If the key is wrong, they land on /not-found — no info leak.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Admin key is required.");
      return;
    }
    setError(null);
    setLoading(true);
    // Navigate to /admin/[key] — server validates it.
    // If wrong, middleware redirects to /not-found automatically.
    router.push(`/admin/${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Card className="w-full max-w-sm p-8 bg-gray-900 ring-gray-800">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <TheramifyLogo size={72} />
        </div>

        <h1 className="text-xl font-bold text-white text-center mb-1">
          Admin Access
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Enter your admin key to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-key" className="sr-only">
              Admin key
            </label>
            <input
              id="admin-key"
              type="password"
              autoComplete="off"
              required
              maxLength={128}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5
                         text-sm text-white placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-red-400">
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
            {loading ? "Verifying…" : "Access Admin Panel"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
