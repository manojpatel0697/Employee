"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./database.types";

/**
 * Returns a Supabase client suitable for use inside Client Components.
 * Reads credentials from NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY automatically.
 */
export function createBrowserClient() {
  return createClientComponentClient<Database>();
}
