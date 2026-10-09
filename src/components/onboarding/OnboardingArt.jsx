import React from "react";

/**
 * The illustration slot — one size, one place, on every onboarding page.
 *
 * Every step draws its artwork through this single wrapper, so the picture can
 * never be a different size or sit differently from one screen to the next: the
 * same width, the same aspect (each illustration is 7:5), the same gap below it
 * and the same centred slot at the top of the step. The artwork is decorative,
 * so it is hidden from screen readers.
 */
export default function OnboardingArt({ children, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full max-w-[280px] mx-auto mb-4 flex-shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}