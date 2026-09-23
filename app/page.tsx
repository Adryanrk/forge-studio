import HeroScene from "@/components/HeroScene";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { StatsBand } from "@/components/site/stats-band";
import { ProgramSection } from "@/components/site/program-section";
import { TrainersSection } from "@/components/site/trainers-section";
import { CtaSection } from "@/components/site/cta-section";

export default function Home() {
  return (
    <>
      <HeroScene />
      <SiteHeader />
      <StatsBand />
      <ProgramSection />
      <TrainersSection />
      <CtaSection />
      <SiteFooter />
    </>
  );
}
