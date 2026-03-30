import { MainShell } from "@/components/layout/main-shell";
import { OnboardCard } from "@/components/dashboard/onboard-card";

export default function OnboardPage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <OnboardCard />
      </div>
    </MainShell>
  );
}
