import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Must be created per-request, never hoisted to a module-level singleton,
 * because it closes over that request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Safe to ignore: the proxy
            // refreshes the session on every request, so the cookie is already
            // up to date by the time this renders.
          }
        },
      },
    },
  );
}
