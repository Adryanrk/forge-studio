# Forge — Strength Training Studio

A marketing site and booking system for Forge, a strength-training studio. Visitors can browse
classes and trainers, register or log in, book a session (class + trainer + date/time), and manage
their own bookings. Built around a cinematic Three.js hero scene, with real auth and data backed by
Supabase.

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **Three.js** for the animated hero scene
- **Supabase** (Postgres + Auth) via `@supabase/ssr` for data and authentication
- **Framer Motion** for scroll-reveal animation on content sections

## Features

- **Hero scene** — scroll-driven camera orbit around a set of crossfading 3D equipment shapes,
  with a shader background that shifts from molten iron to cool steel as you scroll.
- **Program / Trainers** — class and trainer listings pulled live from Supabase.
- **Authentication** — register and log in with email/password (Supabase Auth).
- **Booking** — pick a class, trainer, date, and time, and submit a booking tied to the logged-in
  user.
- **My bookings** — view and cancel your own upcoming bookings.
- **Contact** — studio address, hours, and a contact form.

## Setup

```bash
git clone https://github.com/Adryanrk/forge-studio.git
cd forge-studio
npm install
```

### Environment variables

Create a `.env.local` file in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Locally these go in `.env.local` (git-ignored, never commit it). When deployed, set the same two
variables in your hosting platform's environment variable settings (e.g. Vercel → Project Settings
→ Environment Variables) for each environment you deploy (Production/Preview/Development).

Both are safe to expose client-side — see [`SECURITY.md`](./SECURITY.md) for why, and for the
review performed on this codebase.

### Database schema

The app expects three tables: `classes`, `trainers`, and `bookings`. RLS policies for `classes` and
`trainers` (public read access) are tracked in [`supabase/policies.sql`](./supabase/policies.sql).
The full schema, including `bookings` and its RLS policies, isn't currently captured as a single
script anywhere else in the repo, so it's given here in full — run this in the Supabase SQL editor
on a fresh project:

```sql
-- classes and trainers: public marketing content, readable by anyone
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trainer_id uuid references public.trainers(id)
);

create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  photo_url text
);

alter table public.classes enable row level security;
alter table public.trainers enable row level security;

create policy "Public read access" on public.classes
  for select to anon, authenticated using (true);

create policy "Public read access" on public.trainers
  for select to anon, authenticated using (true);

-- bookings: each row belongs to exactly one authenticated user
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id),
  trainer_id uuid references public.trainers(id),
  booking_date date not null,
  booking_time time not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Users can view own bookings" on public.bookings
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own bookings" on public.bookings
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete own bookings" on public.bookings
  for delete to authenticated using (auth.uid() = user_id);
```

(`classes.trainer_id` is created after `trainers` since it references it; reorder if you run these
as separate statements in the other order.)

## Running locally

```bash
npm run dev
```

Opens at `http://localhost:3000`.

To verify a production build before deploying:

```bash
npm run build
```

## Security

See [`SECURITY.md`](./SECURITY.md) for the security review performed on this codebase (dependency
audit, key exposure, RLS row-isolation testing, XSS resistance of user-submitted fields).

## Live deployment

https://forge-studio-liart.vercel.app
