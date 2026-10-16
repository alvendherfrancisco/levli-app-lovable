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
 * The panel is a column of three, so nothing can sit on top of anything: the head,
 * the part that scrolls (slides and plans), and the fixed footer. On a short phone
 * that middle part scrolls and everything else stays exactly where it is.
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
  const inWrapper = isRunningInIOSWrapper();
  const handleClose = () => {
    if (inWrapper) sendIOSEvent("wanillajs.event.paywall.closeButtonTapped", { userId: user?.id ?? null });
    onClose();
  };
  const sheetRef = useModal({ open, onDismiss: handleClose });

  // A fresh visit starts on the first feature.
  useEffect(() => { if (open) setSlideIndex(0); }, [open]);

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
  const panel =
    "w-full max-w-lg mx-auto flex flex-col h-full sm:h-[88vh] sm:max-h-[calc(100dvh_-_3rem)] sm:rounded-3xl sm:shadow-xl bg-auth-panel backdrop-blur-md overflow-hidden relative z-10 border border-auth-divider";

  const closeButton = (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Close"
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-auth-border bg-auth-card transition-all hover:bg-auth-surface active:scale-95"
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
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-auth-border px-5 pt-safe-5 pb-1.5 sm:px-6">
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
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-auth-border px-5 pt-safe-5 pb-1.5 sm:px-6">
          <div className="flex flex-1 gap-1.5">
            {PREMIUM_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => { sound.tap(); goToSlide(i); }}
                aria-label={slide.label}
                aria-current={i === slideIndex ? "true" : undefined}
                className="flex flex-1 items-center py-2.5"
              >
                <span
                  className={`block h-1.5 w-full rounded-full transition-colors duration-500 ${
                    i <= slideIndex ? "bg-indigo-600" : "bg-auth-track"
                  }`}
                />
              </button>
            ))}
          </div>
          {closeButton}
        </div>

        {/* The middle: the slides and the plans, in the flow's own 20px margins.
            This is the one part that scrolls, and only when the screen is too
            short to hold it. */}
        <div className="relative min-h-0 flex-1">
          <div className="h-full overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            <PaywallSlides trackRef={trackRef} index={slideIndex} onIndexChange={setSlideIndex} />
            <PaywallPlans
              className="mt-6"
              plans={plans}
              selected={selected}
              onSelect={setSelected}
              loading={loading}
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-auth-fade to-transparent"
          />
        </div>

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

      {/* No Subscription Found */}
      {showNoSub && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-8 dark:bg-black/60">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-[#16181f]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Subscription Found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
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