import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * The eyebrow + heading block reused at the top-left of every editorial
 * section (Program, Trainers, CTA, Contact) — same small uppercase label
 * over a serif heading the hero establishes, sized to sit in the ~25%
 * left column of each section's asymmetric grid.
 */
export function SectionHeading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <Reveal>
      <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-heading text-4xl text-foreground sm:text-5xl">{children}</h2>
    </Reveal>
  );
}
