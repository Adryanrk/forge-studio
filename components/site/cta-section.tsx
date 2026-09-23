import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SeamGlow } from "@/components/site/seam-glow";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative border-t border-border/60 bg-background py-14 sm:py-20">
      <SeamGlow tone="cool" />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(200px,25%)_1fr] lg:gap-16">
          <SectionHeading eyebrow="Ready?">Your next heavy lift starts here</SectionHeading>

          <Reveal delay={0.1}>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              Book a session, choose your trainer, and show up. No waiting, no excuses —
              just iron and time.
            </p>
            <Button render={<Link href="/boka" />} nativeButton={false} size="lg" className="mt-8 px-8">
              Book a session
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
