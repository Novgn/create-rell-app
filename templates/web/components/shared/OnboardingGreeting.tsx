'use client';

// Demo consumer for the Zustand app store (Story 4.1). This is a tiny
// client component the dashboard page imports so we can prove the store
// works end-to-end without converting the whole dashboard page into a
// client component. Feel free to delete this once you have real UI.

import { useAppStore } from '@/stores/app-store';

export function OnboardingGreeting() {
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  if (onboardingComplete) {
    return <p>Welcome back.</p>;
  }

  return (
    <p>
      Getting started.{' '}
      <button type="button" onClick={completeOnboarding}>
        Mark onboarding complete
      </button>
    </p>
  );
}
