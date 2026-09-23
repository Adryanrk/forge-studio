import {
  BarbellIcon,
  FireIcon,
  HeartStraightIcon,
  LightningIcon,
  PersonSimpleRunIcon,
  TimerIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SeamGlow } from "@/components/site/seam-glow";
import { getClasses } from "@/lib/queries";

const FALLBACK_ICONS = [BarbellIcon, FireIcon, LightningIcon, HeartStraightIcon, PersonSimpleRunIcon, TimerIcon];

const FALLBACK_DESCRIPTION =
  "A session built on heavy lifts, controlled technique, and relentless progress.";

export async function ProgramSection() {
  const classes = await getClasses();

  return (
    <section id="program" className="relative border-t border-border/60 bg-background py-14 sm:py-20">
      <SeamGlow tone="cool" />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(200px,25%)_1fr] lg:gap-16">
          <SectionHeading eyebrow="Program">Training forged for strength</SectionHeading>

          {classes.length === 0 ? (
            <Reveal delay={0.15}>
              <p className="max-w-lg text-sm text-muted-foreground">
                Our classes are being published here shortly. Reach out via the{" "}
                <a href="/kontakt" className="text-accent underline underline-offset-4">
                  contact page
                </a>{" "}
                if you&apos;d like to know more now.
              </p>
            </Reveal>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {classes.map((klass, index) => {
                const Icon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
                return (
                  <Reveal key={klass.id} delay={(index % 3) * 0.08}>
                    <Card className="h-full border-border/70">
                      <CardHeader>
                        <span className="mb-3 inline-flex size-10 items-center justify-center border border-border/70 text-accent">
                          <Icon size={20} weight="light" />
                        </span>
                        <CardTitle className="font-heading text-lg font-normal text-foreground">
                          {klass.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {klass.description || FALLBACK_DESCRIPTION}
                        </p>
                      </CardContent>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
