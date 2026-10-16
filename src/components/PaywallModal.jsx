import React, { useState } from "react";
import { Crown, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { isRunningInIOSWrapper, sendIOSEvent } from "@/lib/iosBridge";
import { reconcileSubscription } from "@/lib/subscriptionHandler";
import { useSubscription } from "@/lib/SubscriptionContext";
import usePremiumPlans from "@/hooks/usePremiumPlans";
import PaywallBenefits from "@/components/paywall/PaywallBenefits";
import PaywallPlans from "@/components/paywall/PaywallPlans";
import PaywallBar from "@/components/paywall/PaywallBar";

/**
 * Levli Premium, sold in one screen.
 *
 * The sheet is a column of three parts, so nothing can ever sit on top of
 * anything: the close button, the middle — headline, the four benefits and the
 * plans, which is the part that scrolls — and the bar at the foot, which holds
 * the one action, the terms of the plan in hand and the legal row and keeps its
 * own height at the bottom of the screen.
 *
 * Every price on the screen is read from the product as the sheet opens (see
 * src/lib/premiumPlans.js), never carried here; an account that already has
 * Premium is told so instead of being sold it again; and the purchase itself is
 * handed to the App Store, whose own sheet — with the customer's local price —
 * is presented over this one.
 */
export default function PaywallModal({ open, onClose }) {
  const { user } = useAuth();
  const { refreshProfile } = useAppState();
  const { isPremium } = useSubscription();
  const { plans, loading, error: plansError, reload } = usePremiumPlans(open);
  const [selected, setSelected] = useState("yearly");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [showNoSub, setShowNoSub] = useState(false);

  const inWrapper = isRunningInIOSWrapper();
  const handleClose = () => {
    if (inWrapper) sendIOSEvent("wanillajs.event.paywall.closeButtonTapped", { userId: user?.id ?? null });
    onClose();
  };
  const sheetRef = useModal({ open, onDismiss: handleClose });

  if (!open) return null;

  const plan = plans.find((p) => p.id === selected) || plans[0] || null;

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

  const closeRow = (
    <div className="flex justify-end px-4 pt-safe-5 pb-2">
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 active:scale-95 dark:text-gray-500"
      >
        <X size={22} aria-hidden="true" />
      </button>
    </div>
  );

  const shell =
    "fixed inset-0 z-[70] flex flex-col overflow-x-hidden bg-white sheet-lock animate-in slide-in-from-bottom outline-none dark:bg-gray-950";

  // Nothing left to sell: an account that already has Premium is told what it has.
  if (isPremium) {
    return (
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Levli Premium" tabIndex={-1} className={shell}>
        {closeRow}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/15">
            <Crown size={26} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xl font-bold text-gray-900 dark:text-white">You have Premium</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-[#9A9DAE]">
            Every feature is unlocked. Thank you for supporting Levli.
          </p>
          <button type="button" onClick={handleClose} className="btn-pill btn-secondary mt-6 w-full max-w-[280px]">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Levli Premium" tabIndex={-1} className={shell}>
      {closeRow}

      {/* The middle: everything that scrolls, with nothing pinned over it. */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">Unlock Levli Premium</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-[#9A9DAE]">
          Track every shot and see your progress clearly.
        </p>

        <PaywallBenefits />

        <PaywallPlans plans={plans} selected={selected} onSelect={setSelected} loading={loading} />
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