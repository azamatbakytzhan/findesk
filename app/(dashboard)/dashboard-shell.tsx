"use client";

import { useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export function DashboardShell({ showOnboarding }: { showOnboarding: boolean }) {
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding);

  return (
    <>
      {onboardingVisible && (
        <OnboardingWizard onComplete={() => setOnboardingVisible(false)} />
      )}
    </>
  );
}
