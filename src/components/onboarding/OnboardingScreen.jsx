import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import AmbientBackground from "./AmbientBackground";
import useFitScale from "@/hooks/useFitScale";

/**
 * Onboarding shell — warm, light-themed layout matching the Levli marketing site.
 * Segmented progress bar, ghost back button, pill CTA, slide+fade step transitions.
 *
 * One screen per step, never a scroll: the step is measured and scaled into the
 * space between the progress header and the CTA (src/hooks/useFitScale.js), and
 * centred in it, so every question and the primary button are on screen together
 * from a 320 pt phone up to a Pro Max. The only case that scrolls is a window too
 * short to stay legible — a phone in landscape — where the step keeps its
 * minimum readable size and scrolls from the top.
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
  hideFooter = false,
}) {
  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const ctaText = ctaLabel || (isLastStep ? "Go to Home" : "Next");
  const [animClass, setAnimClass] = useState("animate-onb-right");
  const prevStepRef = useRef(step);
  const { areaRef, contentRef, scale, scroll } = useFitScale([step]);

  useEffect(() => {
    setAnimClass(step >= prevStepRef.current ? "animate-onb-right" : "animate-onb-left");
    prevStepRef.current = step;
  }, [step]);

  return (
    <div className="fixed inset-0 bg-[#FAFAFA] flex items-stretch sm:items-center justify-center sm:p-6 overflow-hidden">
      <AmbientBackground />
      <div className="w-full max-w-lg mx-auto flex flex-col h-full sm:h-[88vh] sm:max-h-[calc(100dvh_-_3rem)] sm:rounded-3xl sm:shadow-xl bg-white/70 backdrop-blur-md overflow-hidden relative z-10 border border-gray-100/80">
        {/* Header — back + segmented progress */}
        <div className={`flex items-center px-5 sm:px-6 pt-5 sm:pt-6 pb-1.5 flex-shrink-0 ${isFirstStep ? "" : "gap-3"}`}>
          {/* The back button keeps its 2rem slot on the first step, where there
              is nothing to go back to, so the row is exactly the same height on
              every step and the bar never moves up or down. */}
          <div className={`h-8 flex-shrink-0 ${isFirstStep ? "w-0" : "w-8"}`}>
            {!isFirstStep && (
              <button
                onClick={onBack}
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

        {/* The step — centred in the space the header and footer leave. The
            measured block is the outer div (its height is unaffected by the
            scale), and the animated step sits inside it, so the slide-in
            animation and the fit transform never fight over the same element. */}
        <div
          ref={areaRef}
          className={`flex-1 min-h-0 px-5 sm:px-6 flex justify-center ${
            scroll ? "overflow-y-auto items-start" : "overflow-hidden items-center"
          }`}
        >
          <div
            ref={contentRef}
            className="w-full"
            style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "center center" } : undefined}
          >
            <div key={step} className={`w-full ${animClass}`}>
              {children}
            </div>
          </div>
        </div>

        {/* Footer — the single CTA, always on screen: a fixed-height flex
            sibling of the step, so content never has to reserve space for it.
            Safe-area inset respected via max() for devices with a home
            indicator. */}
        {!hideFooter && (
          <div className="onb-cta px-6 sm:px-8 pt-2 flex-shrink-0 flex flex-col items-center">
            <button
              onClick={canContinue ? onContinue : undefined}
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
                onClick={secondaryAction.onClick}
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