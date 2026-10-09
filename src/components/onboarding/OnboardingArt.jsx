import React from "react";

/**
 * The illustration slot — one size, one place, on every onboarding page.
 *
 * Every step draws its artwork through this single wrapper, so the picture can
 * never be a different size or sit differently from one screen to the next: the
 * same width, the same aspect (each illustration is 7:5), the same gap below it
 * and the same centred slot at the top of the step. The artwork is decorative,
 * so it is hidden from screen readers.
 *
 * `compact` shrinks it modestly — for a screen that makes room while a keyboard
 * is up. It is only ever the picture that changes size; no text does.
 */
export default function OnboardingArt({ children, className = "", compact = false }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full ${compact ? "max-w-[150px]" : "max-w-[280px]"} mx-auto mb-4 flex-shrink-0 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}