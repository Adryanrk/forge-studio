import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware.ts` -> `proxy.ts` and the exported
// `middleware` function -> `proxy` (functionality is unchanged). See
// node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md.

// Optimistic route protection: redirect logged-out visitors away from
// pages that require a session. This is the FIRST line of defense only —
// each protected page also re-checks the user server-side (see
// app/boka/page.tsx and app/mina-bokningar/page.tsx), and the real
// authorization boundary is the `bookings` table's RLS policies.
const PROTECTED_ROUTES = ["/mina-bokningar", "/boka"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on every route except static assets, so the session cookie stays
     * fresh everywhere, but skip anything that clearly isn't a page.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
