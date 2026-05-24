"use client";

import { useEffect, useState } from "react";
import { BudgetSetupModal } from "./BudgetSetupModal";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDone = localStorage.getItem("finora_onboarding_done");
    if (!hasDone) {
      setNeedsOnboarding(true);
    }
  }, []);

  if (!mounted) return null;

  return (
    <>
      {needsOnboarding && (
        <BudgetSetupModal onComplete={() => setNeedsOnboarding(false)} />
      )}
      {children}
    </>
  );
}
