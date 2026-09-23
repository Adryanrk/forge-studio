import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session for every request and reports back
 * the current user (if any). Called from the project's `proxy.ts` (Next.js
 * 16 renamed `middleware.ts` -> `proxy.ts`, see node_modules/next/dist/docs
 * /01-app/02-guides/upgrading/version-16.md).
 *
 * IMPORTANT: don't add logic between `createServerClient` and
 * `supabase.auth.getUser()` — Supabase needs that call to run first so it
 * can refresh an expired token before anything else touches the session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
