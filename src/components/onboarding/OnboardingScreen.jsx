import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import AmbientBackground from "./AmbientBackground";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/**
 * The onboarding shell: one screen, one action, everything visible.
 *
 * Layout
 *  - A header (back + segmented progress), a content area, and a pinned footer
 *    holding the one primary button. The footer is a flex sibling, never an
 *    overlay, so content can never hide behind it.
 *  - The panel is centred with a sensible maximum width, so tablets and
 *    landscape show a card rather than a stretched column.
 *  - Every colour is a theme token, so the flow follows light/dark mode.
 *
 * Fitting without scrolling
 *  - The content area is measured against the space it actually has. When the
 *    content fits, scrolling is off entirely (no bounce, no indicator); it is
 *    turned on only when the content genuinely does not fit — a long list, a
 *    very large text size, or the keyboard being open.
 *
 * Keyboard
 *  - The visual viewport's height is read while typing and the panel is lifted
 *    by exactly the amount the keyboard covers. The field being typed in and the
 *    button both stay reachable, and nothing jumps: the same value is applied
 *    every time the keyboard reports its size.
 *
 * Motion
 *  - Step transitions slide; with Reduce Motion they are dropped, so a step
 *    simply appears.
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
  errorMessage = "",
  hideFooter = false,
  hideBack = false,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const isFirstStep = step === 0;
  const ctaText = ctaLabel || (step === totalSteps - 1 ? "Go to Home" : "Next");

  const [animClass, setAnimClass] = useState("animate-onb-right");
  const prevStepRef = useRef(step);
  const areaRef = useRef(null);      // the viewport the content is measured against
  const contentRef = useRef(null);   // the content itself
  const [overflowing, setOverflowing] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    setAnimClass(step >= prevStepRef.current ? "animate-onb-right" : "animate-onb-left");
    prevStepRef.current = step;
  }, [step]);

  // Scrolling is enabled only when the content is genuinely taller than the room
  // it has. Re-measured whenever the content or the area changes size, so a
  // larger text size, a rotation or a wrapping title all switch it on by itself.
  useLayoutEffect(() => {
    const area = areaRef.current;
    const content = contentRef.current;
    if (!area || !content) return undefined;
    const measure = () => setOverflowing(content.scrollHeight - area.clientHeight > 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    observer.observe(content);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [step]);

  // How much of the screen the keyboard is covering.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const apply = () => {
      const inset = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset > 24 ? inset : 0);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, []);

  // With the keyboard open the focused field must be able to come into view,
  // even on a step that otherwise fits exactly.
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return undefined;
    const onFocus = (e) => {
      const field = e.target;
      if (!field || typeof field.scrollIntoView !== "function") return;
      window.setTimeout(() => field.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" }), 120);
    };
    area.addEventListener("focusin", onFocus);
    return () => area.removeEventListener("focusin", onFocus);
  }, [reducedMotion]);

  const scrollable = overflowing || keyboardInset > 0;

  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-background p-0 text-foreground sm:p-4">
      <div
        className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden bg-background sm:rounded-3xl sm:border sm:border-border sm:shadow-xl"
        style={keyboardInset ? { paddingBottom: `${keyboardInset}px` } : undefined}
      >
        <AmbientBackground still={reducedMotion} />

        {/* Header — back, and a progress bar that always shows the real step. */}
        <div
          className="relative z-10 flex flex-shrink-0 items-center gap-2 px-4 pb-1"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="w-11 flex-shrink-0">
            {!isFirstStep && !hideBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-transform active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
          <div
            className="flex flex-1 gap-1"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${totalSteps}`}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="w-11 flex-shrink-0" />
        </div>

        {/* Content — scrolls only when it has to. The step inside is centred by
            its own auto margins, which is what keeps the top of a long step
            reachable when it has to scroll: centring with justify-content would
            push the overflow out of the top, where no one can scroll to it. */}
        <div
          ref={areaRef}
          data-scrollable={scrollable ? "true" : "false"}
          className={`relative z-10 min-h-0 flex-1 px-4 pb-1 [&>*]:my-auto ${
            scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"
          }`}
        >
          <div
            key={step}
            ref={contentRef}
            className={`flex min-h-full flex-col ${reducedMotion ? "" : animClass}`}
          >
            {children}
          </div>
        </div>

        {/* Footer — the one action, pinned above the safe area. */}
        {!hideFooter && (
          <div
            className="relative z-10 flex flex-shrink-0 flex-col items-center px-4 pt-2"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {errorMessage && (
              <p role="alert" className="mb-2 w-full max-w-[420px] rounded-xl border border-destructive bg-background px-3 py-2 text-center text-sm text-foreground">
                {errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={canContinue ? onContinue : undefined}
              disabled={!canContinue}
              className={`min-h-[52px] w-full max-w-[420px] rounded-full text-base font-semibold transition-all active:scale-[0.98] ${
                canContinue
                  ? "bg-action text-action-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {ctaText}
            </button>
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="mt-1 min-h-[44px] w-full max-w-[420px] text-center text-sm font-medium text-muted-foreground"
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