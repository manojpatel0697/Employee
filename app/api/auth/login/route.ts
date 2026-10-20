import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 *
 * Server-side rate-limited login endpoint.
 * 5 failed attempts per 15 minutes per IP — then locked out.
 * Uses Supabase Auth on the server to authenticate.
 *
 * Returns a session cookie compatible with @supabase/auth-helpers-nextjs.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Strict rate limit: 10 attempts per 15 minutes per IP
  const rl = checkRateLimit(`auth:login:${ip}`, 10, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = sanitizeEmail(rawBody.email);
  const password = sanitizeText(rawBody.password, 128);

  if (!email) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic error — don't reveal whether it's email vs password
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  return NextResponse.json({ user: { id: data.user?.id, email: data.user?.email } });
}
