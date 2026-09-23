import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/#program", label: "Program" },
  { href: "/#tranare", label: "Trainers" },
  { href: "/kontakt", label: "Contact" },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex flex-col gap-1">
          <span className="text-sm font-semibold tracking-[0.3em] text-foreground uppercase">Forge</span>
          <span className="text-[9px] font-medium tracking-[0.2em] text-white/50 uppercase">
            Strength Training Studio
          </span>
        </Link>

        <nav className="hidden items-center gap-7 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-medium tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button render={<Link href="/mina-bokningar" />} nativeButton={false} variant="outline" size="sm">
                My bookings
              </Button>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
                Log in
              </Button>
              <Button render={<Link href="/boka" />} nativeButton={false} size="sm">
                Book a session
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
