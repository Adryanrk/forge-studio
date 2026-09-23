import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p className="tracking-[0.15em] uppercase">© {new Date().getFullYear()} Forge Strength Studio</p>
        <nav className="flex flex-wrap gap-6">
          <Link href="/#program" className="transition-colors hover:text-foreground">
            Program
          </Link>
          <Link href="/#tranare" className="transition-colors hover:text-foreground">
            Trainers
          </Link>
          <Link href="/boka" className="transition-colors hover:text-foreground">
            Book
          </Link>
          <Link href="/kontakt" className="transition-colors hover:text-foreground">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
