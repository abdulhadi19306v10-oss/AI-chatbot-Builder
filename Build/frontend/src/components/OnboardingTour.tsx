"use client";

import { useEffect, useState } from "react";
import type { TooltipRenderProps } from "react-joyride";

export const OnboardingTooltip = ({
  continuous,
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  size,
  isLastStep,
}: TooltipRenderProps) => {
  const showNext = (step as any).showNextButton !== false;

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 shadow-2xl max-w-sm text-left flex flex-col gap-4 relative z-[10002]"
      style={{
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <h4 className="font-bold text-ink text-[16px] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          {step.title || "Quick Guide"}
        </h4>
        <button
          {...skipProps}
          className="text-xs text-secondary hover:text-ink font-semibold transition-colors shrink-0 cursor-pointer"
        >
          Skip tour
        </button>
      </div>

      <div className="text-secondary text-sm leading-relaxed font-sans">
        {step.content}
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
        <span className="text-xs text-secondary font-medium font-sans">
          Step {index + 1} of {size}
        </span>
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 border border-border hover:bg-paper text-secondary hover:text-ink text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          {showNext && (
            <button
              {...primaryProps}
              className="px-4 py-2 bg-signal-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isLastStep ? "Finish" : (index === 0 ? "Start" : "Next")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const joyrideStyles = {
  options: {
    overlayColor: "rgba(20, 23, 31, 0.5)", // Ink at 50% opacity
    zIndex: 10000,
  },
  spotlight: {
    borderRadius: "12px",
  }
};

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}
