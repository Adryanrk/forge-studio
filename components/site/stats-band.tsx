import { Reveal } from "@/components/motion/reveal";

// Placeholder values — swap in real numbers whenever available.
const STATS = [
  { value: "3", label: "Expert Trainers" },
  { value: "3", label: "Weekly Programs" },
  { value: "2024", label: "Est." },
];

export function StatsBand() {
  return (
    <div className="border-b border-border/60 bg-background">
      <Reveal>
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-12 gap-y-3 px-6 py-6 sm:px-10 lg:px-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <span className="font-heading text-2xl text-foreground sm:text-3xl">{stat.value}</span>
              <span className="text-muted-foreground/60">—</span>
              <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
