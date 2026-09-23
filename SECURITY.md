# Security Review

**Date:** 2026-09-22

## Dependency audit

Ran `npm audit`. Result: **0 vulnerabilities**.

## Supabase key exposure

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed client-side via `.env.local`. This
is safe by design — Supabase's anon key is meant to be public; access control
is enforced by Row Level Security policies on the database side, not by
keeping this key secret.

Confirmed by searching the codebase (excluding `node_modules`/`.next`) for
`service_role` / `SUPABASE_SERVICE_*`: **no matches**. No service-role key is
referenced anywhere in this repo, client or server. `.env.local` is
git-ignored (`.env*` in `.gitignore`), so no key material is committed.

## Bookings row-level isolation (RLS)

**Method: manual test, performed by the developer, 2026-09-22.**

Created two separate user accounts, logged in as each in turn, and confirmed
each account's "My bookings" page showed only its own booking — the other
account's booking was not visible. Both bookings were confirmed present in
the `bookings` table directly in Supabase, ruling out an empty-query false
negative. The row-level security policy on `bookings` correctly scopes
results per `user_id`.

This is enforced by the RLS policy configured on the `bookings` table in the
Supabase project (not tracked in this repo — a reference copy is commented
out in `supabase/policies.sql` for documentation). The application query
(`getUserBookings()` in `lib/queries.ts`) also filters by
`.eq("user_id", userId)` explicitly, as defense in depth on top of RLS.

## XSS resistance of user-submitted text (booking notes)

**Method: manual test, performed by the developer, 2026-09-22.**

Submitted a booking with the note `<script>alert(1)</script>`, then viewed it
on "My bookings": it rendered as the literal escaped text
`<script>alert(1)</script>` on the page, no alert dialog fired — confirming
no script injection vulnerability via this field.

This matches the codebase: `booking.note` is rendered in
`app/mina-bokningar/page.tsx` as a plain JSX text child (`{booking.note}`),
which React escapes automatically, and no `dangerouslySetInnerHTML` exists
anywhere in `app/` or `components/`.
