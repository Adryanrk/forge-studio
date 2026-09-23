-- Run this in the Supabase SQL editor.
--
-- `classes` and `trainers` are public marketing content (shown on the
-- homepage to every visitor, logged in or not, and used to populate the
-- /boka dropdowns). Right now, querying them with the anon key returns an
-- empty array even though rows exist — RLS is enabled with no read policy,
-- so anon/authenticated requests are silently filtered to nothing.
--
-- This adds a public SELECT policy for both tables. It's safe to run even
-- if RLS/policies already exist in some form — the DROP POLICY IF EXISTS
-- makes it idempotent.

alter table public.classes enable row level security;

drop policy if exists "Public read access" on public.classes;
create policy "Public read access"
  on public.classes
  for select
  to anon, authenticated
  using (true);

alter table public.trainers enable row level security;

drop policy if exists "Public read access" on public.trainers;
create policy "Public read access"
  on public.trainers
  for select
  to anon, authenticated
  using (true);

-- `bookings` should already have RLS policies scoping rows to their owner
-- (per the schema you described). For reference, this is the shape the
-- app assumes — adjust names if yours differ:
--
-- alter table public.bookings enable row level security;
--
-- create policy "Users can view own bookings"
--   on public.bookings for select
--   to authenticated
--   using (auth.uid() = user_id);
--
-- create policy "Users can insert own bookings"
--   on public.bookings for insert
--   to authenticated
--   with check (auth.uid() = user_id);
--
-- create policy "Users can delete own bookings"
--   on public.bookings for delete
--   to authenticated
--   using (auth.uid() = user_id);
