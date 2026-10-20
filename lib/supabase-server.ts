import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Returns a Supabase client for use in Server Components.
 * Compatible with Next.js 15 where cookies() returns a Promise.
 *
 * Usage (in a Server Component):
 *   const supabase = createServerClient();
 */
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies });
}
