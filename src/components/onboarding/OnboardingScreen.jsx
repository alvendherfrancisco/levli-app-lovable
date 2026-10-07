import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import AmbientBackground from "./AmbientBackground";
import { sound } from "@/lib/sounds";

/**
 * Onboarding shell — one layout for every step: a fixed header (back button and
 * progress bar), the step itself as the only scrolling area, and a fixed footer
 * holding the single primary button.
 *
 * Readability first: nothing is scaled down or hidden to avoid a scroll, and the
 * step is drawn at its natural size. The step area is top-aligned, so the
 * illustration slot sits the same distance below the header on every page, and
 * it scrolls only when the step is taller than the space it has. The header
 * carries its own surface and grows a hairline divider once the step scrolls, so
 * content never shows through or looks cut off under the progress bar.
 */
export default function OnboardingScreen({
  step,
  totalSteps,
  children,
  onContinue,
  onBack,
  ctaLabel,
  canContinue = true,
  secondaryAction,
  ctaNote,
  hideFooter = false,
}) {
  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const ctaText = ctaLabel || (isLastStep ? "Go to Home" : "Next");
  // Every screen in the flow sounds the same: a soft tap on any control, and the
  // completion chime on the last step, which is where onboarding actually saves.
  const continueCue = () => { if (isLastStep) sound.success(); else sound.tap(); };
  const [animClass, setAnimClass] = useState("animate-onb-right");
  const prevStepRef = useRef(step);
  // Whether the step in hand has been scrolled, which is what reveals the
  // header's hairline divider.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setAnimClass(step >= prevStepRef.current ? "animate-onb-right" : "animate-onb-left");
    prevStepRef.current = step;
  }, [step]);

  return (
    <div className="fixed inset-0 bg-background flex items-stretch sm:items-center justify-center sm:p-6 overflow-hidden">
      <AmbientBackground />
      <div className="w-full max-w-lg mx-auto flex flex-col h-full sm:h-[88vh] sm:max-h-[calc(100dvh_-_3rem)] sm:rounded-3xl sm:shadow-xl bg-white/70 dark:bg-white/[0.05] backdrop-blur-md overflow-hidden relative z-10 border border-gray-100/80 dark:border-white/[0.08]">
        {/* Header — back + segmented progress. It has its own surface and keeps
            a 1px transparent border, so revealing the divider when the step
            scrolls never moves anything by a pixel. */}
        <div className={`flex items-center px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex-shrink-0 border-b transition-colors duration-200 ${
          scrolled ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent"
        } ${isFirstStep ? "" : "gap-3"}`}>
          {/* The back button keeps its 2rem slot on the first step, where there
              is nothing to go back to, so the row is exactly the same height on
              every step and the bar never moves up or down. */}
          <div className={`h-8 flex-shrink-0 ${isFirstStep ? "w-0" : "w-8"}`}>
            {!isFirstStep && (
              <button
                onClick={() => { sound.tap(); onBack(); }}
                className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
                aria-label="Back"
              >
                <ChevronLeft size={17} className="text-muted-foreground" />
              </button>
            )}
          </div>
          {/* On the first step the bar is centred instead: the slot and its gap
              come to 2.75rem, so half of that (1.375rem) is left as empty space
              on each side. The bar itself keeps exactly the same width, and so
              the same segment size, as on every other step. */}
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${totalSteps}`}
            className={`flex-1 flex gap-1.5 ${isFirstStep ? "mx-[1.375rem]" : ""}`}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* The step — the one part that scrolls, and it only scrolls when it is
            taller than the space it has. Nothing here is scaled down or hidden
            to make it fit: the step is drawn at its natural size, top-aligned so
            the illustration slot lands the same distance below the header on
            every page, while the progress header above and the CTA below stay
            put. The padding at the end keeps the last block clear of the footer. */}
        <div className="relative flex-1 min-h-0">
          <div
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
            className="h-full overflow-y-auto overscroll-contain px-5 sm:px-6 pt-4 pb-6"
          >
            <div className="min-h-full flex flex-col justify-start">
              <div key={step} className={`w-full ${animClass}`}>
                {children}
              </div>
            </div>
          </div>
          {/* The step's artwork leaves through a soft edge at the top and the
              last card leaves through one at the bottom, instead of either being
              cut off in a hard line by the header or the button. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background/95 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background/95 to-transparent"
          />
        </div>

        {/* Footer — the single CTA, always on screen: a fixed-height flex
            sibling of the step, so content never has to reserve space for it.
            Safe-area inset respected via max() for devices with a home
            indicator. */}
        {!hideFooter && (
          <div className="onb-cta px-6 sm:px-8 pt-2 flex-shrink-0 flex flex-col items-center">
            {/* What is still missing, said in short, sitting with the button so
                it is on screen at the moment the button will not continue. */}
            {ctaNote && (
              <p role="status" className="text-sm font-medium text-orange-700 dark:text-orange-300 text-center max-w-[400px] mb-2 px-2 leading-snug">
                {ctaNote}
              </p>
            )}
            <button
              onClick={canContinue ? () => { continueCue(); onContinue(); } : undefined}
              disabled={!canContinue}
              className={`onb-cta-btn w-full max-w-[400px] rounded-full font-semibold text-base sm:text-lg transition-all duration-300 active:scale-95 ${
                canContinue
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {ctaText}
            </button>
            {secondaryAction && (
              <button
                onClick={() => { sound.tap(); secondaryAction.onClick(); }}
                className="w-full max-w-[400px] text-center text-muted-foreground text-sm font-medium mt-3 hover:text-foreground transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}