import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { Database } from "./database.types";

/**
 * Returns a Supabase client for use in Server Components.
 * Must be called with the cookies() store from next/headers.
 *
 * Example:
 *   import { cookies } from 'next/headers';
 *   const supabase = createServerClient(cookies());
 */
export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}
