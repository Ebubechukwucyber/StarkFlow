import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsStrip } from "@/components/landing/stats-strip";
import { MainShell } from "@/components/layout/main-shell";

export default function HomePage() {
  return (
    <MainShell>
      <HeroSection />
      <StatsStrip />
      <FeaturesSection />
      <CtaSection />
    </MainShell>
  );
}
