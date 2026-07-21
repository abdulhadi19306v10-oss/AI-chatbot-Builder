"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getBackendUrl } from "@/lib/config";

interface OnboardingContextProps {
  onboardingCompletedAt: string | null;
  onboardingStep: number;
  isLoading: boolean;
  runTour: boolean;
  setRunTour: (run: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateStep: (stepIndex: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  replayOnboarding: () => Promise<void>;
  fetchState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [runTour, setRunTour] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const fetchState = useCallback(async () => {
    const token = (session as any)?.id_token;
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${getBackendUrl()}/auth/onboarding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardingCompletedAt(data.onboarding_completed_at);
        setOnboardingStep(data.onboarding_step || 0);
        setCurrentStep(data.onboarding_step || 0);
        if (data.onboarding_completed_at === null) {
          setRunTour(true);
        } else {
          setRunTour(false);
        }
      }
    } catch (e) {
      console.error("Error fetching onboarding state:", e);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchState();
    } else {
      setIsLoading(false);
    }
  }, [session, fetchState]);

  const updateStep = async (stepIndex: number) => {
    const token = (session as any)?.id_token;
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/auth/onboarding`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ onboarding_step: stepIndex })
      });
      if (res.ok) {
        setOnboardingStep(stepIndex);
        setCurrentStep(stepIndex);
      }
    } catch (e) {
      console.error("Error updating onboarding step:", e);
    }
  };

  const completeOnboarding = async () => {
    const token = (session as any)?.id_token;
    if (!token) return;
    const completedAt = new Date().toISOString();
    try {
      const res = await fetch(`${getBackendUrl()}/auth/onboarding`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ onboarding_completed_at: completedAt })
      });
      if (res.ok) {
        setOnboardingCompletedAt(completedAt);
        setRunTour(false);
      }
    } catch (e) {
      console.error("Error completing onboarding:", e);
    }
  };

  const replayOnboarding = async () => {
    const token = (session as any)?.id_token;
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/auth/onboarding`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ onboarding_completed_at: null, onboarding_step: 0 })
      });
      if (res.ok) {
        setOnboardingCompletedAt(null);
        setOnboardingStep(0);
        setCurrentStep(0);
        setRunTour(true);
      }
    } catch (e) {
      console.error("Error resetting onboarding:", e);
    }
  };

  return (
    <OnboardingContext.Provider value={{
      onboardingCompletedAt,
      onboardingStep,
      isLoading,
      runTour,
      setRunTour,
      currentStep,
      setCurrentStep,
      updateStep,
      completeOnboarding,
      replayOnboarding,
      fetchState
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
