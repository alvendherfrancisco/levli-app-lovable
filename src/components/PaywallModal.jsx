import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { sound } from "@/lib/sounds";
import { isRunningInIOSWrapper, sendIOSEvent } from "@/lib/iosBridge";
import { reconcileSubscription } from "@/lib/subscriptionHandler";
import { useSubscription } from "@/lib/SubscriptionContext";
import usePremiumPlans from "@/hooks/usePremiumPlans";
import { PREMIUM_SLIDES } from "@/lib/premiumPlans";
import AmbientBackground from "@/components/onboarding/AmbientBackground";
import { CompletionIllustration } from "@/components/onboarding/OnboardingIllustrations";
import PaywallSlides from "@/components/paywall/PaywallSlides";
import PaywallPlans from "@/components/paywall/PaywallPlans";
import PaywallBar from "@/components/paywall/PaywallBar";
import { HEADING, PRIMARY_BTN, PRIMARY_BTN_ON, SUBTITLE } from "@/lib/uiStyles";

/**
 * Levli Premium, sold as the flow's last step.
 *
 * The screen is an onboarding page, drawn with the onboarding's own parts: the
 * same page, wash and panel (AmbientBackground and the auth theme tokens), the
 * same segmented progress bar across the head — here three segments, one per
 * feature — the same close button as the flow's back button, the same artwork
 * slot, headline type and muted line, and the same CTA footer. Only the contents
 * differ: three slides to swipe through, the plans under them, and the button that
 * starts the plan in hand.
 *
 * The panel is a column: the head, the part that scrolls (the slides and the
 * plans), and the bar pinned across the foot. The scroll area keeps the bar's own
 * height as its last padding, so the last plan row always comes to rest above the
 * bar and the button never covers it — and the illustration area gives way on a
 * short screen before anything has to be clipped.
 *
 * Every price on the screen is read from the product as it opens (see
 * src/lib/premiumPlans.js), never carried here; an account that already has
 * Premium is thanked instead of being sold it again; and the purchase itself is
 * handed to the App Store, whose own sheet — with the customer's local price — is
 * presented over this one.
 */
export default function PaywallModal({ open, onClose }) {
  const { user } = useAuth();
  const { refreshProfile } = useAppState();
  const { isPremium } = useSubscription();
  const { plans, loading, error: plansError, reload } = usePremiumPlans(open);
  const [selected, setSelected] = useState("yearly");
  const [slideIndex, setSlideIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [showNoSub, setShowNoSub] = useState(false);

  const trackRef = useRef(null);
  const barRef = useRef(null);
  const [barHeight, setBarHeight] = useState(0);
  const inWrapper = isRunningInIOSWrapper();
  const handleClose = () => {
    if (inWrapper) sendIOSEvent("wanillajs.event.paywall.closeButtonTapped", { userId: user?.id ?? null });
    onClose();
  };
  const sheetRef = useModal({ open, onDismiss: handleClose });

  // A fresh visit starts on the first feature.
  useEffect(() => { if (open) setSlideIndex(0); }, [open]);

  // How tall the bottom bar is, measured as it renders. The scroll area ends with
  // exactly that much room under the plans (see the spacer in the content), so the
  // last plan row can always be scrolled clear of the bar and the home indicator —
  // however tall the bar grows: a plan note that wraps, a larger text size, the
  // safe area on one device and not another.
  useEffect(() => {
    const el = barRef.current;
    if (!el || !open || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => setBarHeight(Math.round(el.offsetHeight));
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  const plan = plans.find((p) => p.id === selected) || plans[0] || null;

  // Paging a slide: the track is scrolled to it, and the progress bar follows
  // immediately rather than waiting for the scroll to settle.
  const goToSlide = (index) => {
    setSlideIndex(index);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const handleSubscribe = async () => {
    setPurchaseError("");
    // The purchase is completed by the App Store, in the app itself: without that
    // bridge there is nothing on this screen to buy with, and saying so is better
    // than a button that does nothing.
    const store = window.webkit?.messageHandlers?.gameEvents;
    if (!store?.postMessage) {
      setPurchaseError("Purchases are completed in the Levli app for iPhone. Open the app and try again.");
      return;
    }
    setBusy(true);
    try {
      // StoreKit trigger: posted verbatim, outside the wanillajs envelope.
      store.postMessage({ notificationName: "paywall.subscriptions.show" });
      sendIOSEvent("wanillajs.event.paywall.subscribeButtonTapped", { userId: user?.id ?? null, plan: plan?.id ?? null });
      // The App Store sheet is presented over this screen, and the entitlement
      // comes back through the wrapper's own status hint, which closes this sheet.
      // Checking here as well is what turns a sheet that never opened into a
      // message with a way to try again.
      const state = await reconcileSubscription();
      if (state?.active) {
        refreshProfile?.();
        sound.success();
        toast.success("Welcome to Levli Premium!");
        onClose();
      }
    } catch {
      setPurchaseError("We couldn't reach the App Store. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setPurchaseError("");
    setRestoring(true);
    try {
      const s = await reconcileSubscription();
      refreshProfile?.();
      if (s.active) {
        toast.success("Premium restored!");
        onClose();
      } else {
        setShowNoSub(true);
      }
    } catch {
      setPurchaseError("We couldn't check your purchases. Try again in a moment.");
    } finally {
      setRestoring(false);
    }
  };

  // A single failure line for the bar, and the retry that belongs to whichever
  // half of the screen failed — the plans, or the purchase.
  const barError = purchaseError || plansError;
  const retry = plansError ? reload : handleSubscribe;

  // z-70 keeps the screen above every sheet the app opens (the dose sheets sit at
  // z-60) while staying under the toasts.
  const shell =
    "auth-screen fixed inset-0 z-[70] bg-auth-page flex items-stretch sm:items-center justify-center sm:p-6 overflow-hidden";
  // The panel is the screen's own surface, and on the wide screens where it floats
  // it carries a soft, brand-tinted shadow rather than a plain grey one. It also
  // arrives rather than appearing: one short rise as the screen opens (see
  // .paywall-in in src/index.css), dropped entirely with reduced motion.
  const panel =
    "paywall-in w-full max-w-lg mx-auto flex flex-col h-full sm:h-[calc(100dvh_-_3rem)] sm:rounded-3xl sm:shadow-2xl sm:shadow-indigo-950/15 bg-auth-panel backdrop-blur-md overflow-hidden relative z-10 border border-auth-divider";

  const closeButton = (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Close"
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-auth-border bg-auth-card transition-all hover:bg-auth-surface active:scale-95"
    >
      <X size={17} className="text-auth-muted" aria-hidden="true" />
    </button>
  );

  // Nothing left to sell: an account that already has Premium is thanked.
  if (isPremium) {
    return (
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Levli Premium" tabIndex={-1} className={shell}>
        <AmbientBackground themed />
        <div className={panel}>
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-auth-border px-4 pt-safe-5 pb-1.5">
            <div className="flex-1" />
            {closeButton}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            <div className="flex min-h-full flex-col justify-center gap-6">
              <CompletionIllustration />
              <div>
                <h2 className={`${HEADING} text-center`}>You have Premium</h2>
                <p className={`${SUBTITLE} mt-2 text-center`}>Everything is unlocked.</p>
              </div>
            </div>
          </div>

          <div className="onb-shell-cta flex-shrink-0 border-t border-auth-border px-6 sm:px-8">
            <button type="button" onClick={handleClose} className={`${PRIMARY_BTN} ${PRIMARY_BTN_ON} mx-auto block max-w-[400px]`}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Levli Premium" tabIndex={-1} className={shell}>
      <AmbientBackground themed />
      <div className={panel}>
        {/* The head: the flow's own segmented progress bar, one segment per
            feature, and the close button where the back button sits. */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-auth-border px-4 pt-safe-5">
          <div className="flex flex-1 gap-1.5">
            {PREMIUM_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => { sound.tap(); goToSlide(i); }}
                aria-label={slide.label}
                aria-current={i === slideIndex ? "true" : undefined}
                className="flex flex-1 items-center py-3"
              >
                {/* What is behind you and the step in hand are indigo, and the
                    step in hand keeps a soft halo, so the screen says where it is
                    without a label. */}
                <span
                  className={`block h-1.5 w-full rounded-full transition-all duration-500 ${
                    i <= slideIndex
                      ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.45)]"
                      : "bg-auth-track shadow-none"
                  }`}
                />
              </button>
            ))}
          </div>
          {closeButton}
        </div>

        {/* The middle: the slides and the plans, in the same 16px margins as the
            rest of the screen, under a 24px gap below the progress bar. This is the
            one part that scrolls, and only when the screen is too short to hold it
            — the illustration area has already given way first (see .paywall-art in
            src/index.css). */}
        <div className="relative min-h-0 flex-1">
          <div className="h-full overflow-y-auto overscroll-contain px-4 pt-4">
            <PaywallSlides trackRef={trackRef} index={slideIndex} onIndexChange={setSlideIndex} />
            <PaywallPlans
              className="mt-6"
              plans={plans}
              selected={selected}
              onSelect={setSelected}
              loading={loading}
            />
            {/* The room the bottom bar takes, so the last plan row (Lifetime) is
                never left sitting under it or under the home indicator. */}
            <div aria-hidden="true" style={{ height: barHeight + 16 }} />
          </div>
          {/* The two soft edges of the part that scrolls: what the slides and the
              plans leave through, above and below, rather than being cut off by
              the progress bar or by the bar pinned under them. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-auth-fade to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-auth-fade to-transparent"
          />
        </div>

        <div ref={barRef} className="absolute inset-x-0 bottom-0 z-10">
          <PaywallBar
            label={plan?.button || "Continue"}
            terms={plan?.terms || ""}
            busy={busy}
            disabled={!plan}
            error={barError}
            onSubscribe={handleSubscribe}
            onRetry={retry}
            onRestore={handleRestore}
            restoring={restoring}
          />
        </div>
      </div>

      {/* No Subscription Found */}
      {showNoSub && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-8 dark:bg-black/60">
          <div className="w-full max-w-xs rounded-2xl border border-auth-border bg-auth-card p-6 text-center shadow-xl">
            <h3 className="text-lg font-bold text-auth-heading">No Subscription Found</h3>
            <p className="mt-2 text-sm text-auth-muted">
              We couldn't find an active subscription for your account.
            </p>
            <button type="button" onClick={() => setShowNoSub(false)} className="btn-pill btn-primary mt-5 w-full">
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}