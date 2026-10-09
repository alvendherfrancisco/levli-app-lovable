import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import AmbientBackground from "./AmbientBackground";
import { sound } from "@/lib/sounds";

/**
 * Onboarding shell — warm, light-themed layout matching the Levli marketing site.
 * Segmented progress bar, ghost back button, pill CTA, slide+fade step transitions.
 *
 * Readability first: every step is drawn at its natural size, and the step area
 * is the only part that scrolls. The progress header above it and the primary
 * CTA below it are fixed siblings, so both stay exactly where they are while a
 * taller step — the medication list, the privacy screen — scrolls between them.
 * A short step simply stays centred in the space they leave.
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
  fill = false,
}) {
  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const ctaText = ctaLabel || (isLastStep ? "Go to Home" : "Next");
  // Every screen in the flow sounds the same: a soft tap on any control, and the
  // completion chime on the last step, which is where onboarding actually saves.
  const continueCue = () => { if (isLastStep) sound.success(); else sound.tap(); };
  const [animClass, setAnimClass] = useState("animate-onb-right");
  // Whether the step has been scrolled: that is what draws the header's
  // hairline, so a short step shows none and a long one divides cleanly.
  const [scrolled, setScrolled] = useState(false);
  const prevStepRef = useRef(step);

  useEffect(() => {
    setAnimClass(step >= prevStepRef.current ? "animate-onb-right" : "animate-onb-left");
    prevStepRef.current = step;
  }, [step]);

  return (
    <div className="fixed inset-0 bg-[#FAFAFA] flex items-stretch sm:items-center justify-center sm:p-6 overflow-hidden">
      <AmbientBackground />
      <div className="w-full max-w-lg mx-auto flex flex-col h-full sm:h-[88vh] sm:max-h-[calc(100dvh_-_3rem)] sm:rounded-3xl sm:shadow-xl bg-white/70 backdrop-blur-md overflow-hidden relative z-10 border border-gray-100/80">
        {/* Header — back + segmented progress */}
        <div
          className={`flex flex-shrink-0 items-center border-b px-5 pt-5 pb-1.5 transition-colors sm:px-6 sm:pt-6 ${
            scrolled ? "border-gray-200" : "border-transparent"
          } ${isFirstStep ? "" : "gap-3"}`}
        >
          {/* The back button keeps its 2rem slot on the first step, where there
              is nothing to go back to, so the row is exactly the same height on
              every step and the bar never moves up or down. */}
          <div className={`h-8 flex-shrink-0 ${isFirstStep ? "w-0" : "w-8"}`}>
            {!isFirstStep && (
              <button
                onClick={() => { sound.tap(); onBack(); }}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                aria-label="Back"
              >
                <ChevronLeft size={17} className="text-gray-600" />
              </button>
            )}
          </div>
          {/* On the first step the bar is centred instead: the slot and its gap
              come to 2.75rem, so half of that (1.375rem) is left as empty space
              on each side. The bar itself keeps exactly the same width, and so
              the same segment size, as on every other step. */}
          <div className={`flex-1 flex gap-1.5 ${isFirstStep ? "mx-[1.375rem]" : ""}`}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i <= step ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* The step — the one part that scrolls. Nothing here is scaled down or
            hidden to make it fit: the step is drawn at its normal size and
            scrolls inside this area, while the progress header above and the CTA
            below stay put. A short step stays centred in the space they leave. */}
        <div className="relative flex-1 min-h-0">
          <div
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
            className="h-full overflow-y-auto overscroll-contain px-5 sm:px-6 py-4"
          >
            {/* min-h-full with my-auto centres a short step, and lets a tall one
                scroll from its very top instead of being clipped at the top.
                A step that carries its own pinned footer fills the space instead
                (fill), so that footer sits at the bottom on every screen size. */}
            <div className="flex min-h-full flex-col">
              <div key={step} className={`w-full ${fill ? "flex flex-1 flex-col" : "my-auto"} ${animClass}`}>
                {children}
              </div>
            </div>
          </div>
          {/* A step taller than the space it has scrolls under the pinned header,
              so its artwork leaves through a soft edge instead of being cut off
              in a hard line. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white/95 to-transparent"
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
              <p role="status" className="text-[13.5px] font-medium text-orange-700 text-center max-w-[400px] mb-2 px-2 leading-snug">
                {ctaNote}
              </p>
            )}
            <button
              onClick={canContinue ? () => { continueCue(); onContinue(); } : undefined}
              disabled={!canContinue}
              className={`onb-cta-btn w-full max-w-[400px] rounded-full font-semibold text-base sm:text-lg transition-all duration-300 active:scale-95 ${
                canContinue
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {ctaText}
            </button>
            {secondaryAction && (
              <button
                onClick={() => { sound.tap(); secondaryAction.onClick(); }}
                className="w-full max-w-[400px] text-center text-gray-500 text-sm font-medium mt-3 hover:text-gray-700 transition-colors"
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