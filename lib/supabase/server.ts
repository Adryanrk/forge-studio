import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes auth cookies via `next/headers`.
 *
 * Must be created fresh (awaited) on every call — it captures the
 * current request's cookie jar.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` was called from a Server Component during rendering.
            // This can be ignored as long as `proxy.ts` is refreshing the
            // user's session (see lib/supabase/middleware.ts).
          }
        },
      },
    }
  );
}
