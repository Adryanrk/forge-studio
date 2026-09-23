import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClasses, getTrainers } from "@/lib/queries";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BookingForm } from "./booking-form";

export default async function BokaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: `proxy.ts` already redirects logged-out visitors away
  // from /boka, but this page re-checks server-side too (see
  // node_modules/next/dist/docs — Proxy is an optimistic check only).
  if (!user) {
    redirect("/login?redirectTo=/boka");
  }

  const [classes, trainers] = await Promise.all([getClasses(), getTrainers()]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">Book</p>
          <h1 className="mt-3 font-heading text-4xl text-foreground">Book a session</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a class, trainer, date and time — see you in the studio.
          </p>
          <div className="mt-10">
            <BookingForm classes={classes} trainers={trainers} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
