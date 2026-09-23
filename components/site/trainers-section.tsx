import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SeamGlow } from "@/components/site/seam-glow";
import { getTrainers } from "@/lib/queries";

const FALLBACK_SPECIALTY = "Personal trainer";

export async function TrainersSection() {
  const trainers = await getTrainers();

  return (
    <section id="tranare" className="relative border-t border-border/60 bg-background py-14 sm:py-20">
      <SeamGlow tone="warm" />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(200px,25%)_1fr] lg:gap-16">
          <SectionHeading eyebrow="Trainers">The people who push you forward</SectionHeading>

          {trainers.length === 0 ? (
            <Reveal delay={0.15}>
              <p className="max-w-lg text-sm text-muted-foreground">
                Our trainer team will be introduced here shortly.
              </p>
            </Reveal>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.map((trainer, index) => (
                <Reveal key={trainer.id} delay={(index % 3) * 0.08}>
                  <div className="group transition-transform duration-300 ease-out hover:-translate-y-1">
                    <div className="relative aspect-[3/4] overflow-hidden border border-border/70 bg-card transition-colors duration-300 group-hover:border-accent/60">
                      {trainer.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL, host unknown ahead of time
                        <img
                          src={trainer.photo_url}
                          alt={trainer.name}
                          className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="size-24 shrink-0 rounded-full bg-gradient-to-br from-accent to-primary p-[2px]">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-card">
                              <span className="font-heading text-3xl font-normal text-foreground">
                                {trainer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-heading text-lg text-foreground">{trainer.name}</h3>
                    <p className="text-xs tracking-[0.08em] text-accent uppercase">
                      {trainer.specialty || FALLBACK_SPECIALTY}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
