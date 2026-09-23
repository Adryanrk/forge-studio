import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserBookings } from "@/lib/queries";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CancelBookingButton } from "./cancel-booking-button";

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

export default async function MinaBokningarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: `proxy.ts` already redirects logged-out visitors away
  // from /mina-bokningar.
  if (!user) {
    redirect("/login?redirectTo=/mina-bokningar");
  }

  // RLS restricts `bookings` rows to their owner already — `getUserBookings`
  // still filters by `userId` explicitly, as defense in depth.
  const bookings = await getUserBookings(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">Your account</p>
          <h1 className="mt-3 font-heading text-4xl text-foreground">My bookings</h1>

          {bookings.length === 0 ? (
            <div className="mt-10 border border-border/70 p-8 text-center">
              <p className="text-sm text-muted-foreground">You don&apos;t have any bookings yet.</p>
              <Button render={<Link href="/boka" />} nativeButton={false} className="mt-5">
                Book your first session
              </Button>
            </div>
          ) : (
            <ul className="mt-10 space-y-4">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-heading text-lg text-foreground">
                          {booking.classes?.name ?? "Class"}
                        </p>
                        <p className="mt-1 text-xs tracking-[0.05em] text-accent uppercase">
                          {booking.trainers?.name ?? "No trainer selected"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground capitalize">
                          {formatDate(booking.booking_date)} · {formatTime(booking.booking_time)}
                        </p>
                        {booking.note && (
                          <p className="mt-2 text-xs text-muted-foreground italic">
                            &ldquo;{booking.note}&rdquo;
                          </p>
                        )}
                      </div>
                      <CancelBookingButton bookingId={booking.id} />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
