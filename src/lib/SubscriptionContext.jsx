import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAppState } from "@/lib/AppState";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { hasCompedAccess } from "@/lib/compedAccess";
import PaywallModal from "@/components/PaywallModal";
import { getSubscriptionState, reconcileSubscription } from "@/lib/subscriptionHandler";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { profile, refreshProfile } = useAppState();
  const { user } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Accounts with complimentary full access (see src/lib/compedAccess.js) are
  // unlocked on their own email alone, so they need no profile and no
  // subscription to reach every premium feature.
  const isComped = hasCompedAccess(user?.email);

  // App Store entitlement from the iOS wrapper hint, reconciled with the database
  // (src/lib/subscriptionHandler.js).
  const [storeSub, setStoreSub] = useState(getSubscriptionState);
  useEffect(() => {
    const on = (e) => setStoreSub(e.detail);
    window.addEventListener("subscription-status-hint", on);
    window.addEventListener("subscriptionUpdated", on);
    if (user?.id) reconcileSubscription();
    return () => {
      window.removeEventListener("subscription-status-hint", on);
      window.removeEventListener("subscriptionUpdated", on);
    };
  }, [user?.id]);
  useEffect(() => { if (storeSub.active) setPaywallOpen(false); }, [storeSub.active]);

  const isPremium = isComped || storeSub.active === true || (() => {
    if (!profile) return false;
    if (profile.plan_type === "lifetime" && profile.subscription_status === "active") return true;
    if (profile.subscription_status === "active" || profile.subscription_status === "trialing") return true;
    return false;
  })();

  // After returning from a successful checkout, verify the payment directly
  // with PayMongo (fallback in case the webhook hasn't processed yet) and
  // refresh the profile. Waits until auth has loaded before running.
  const checkoutHandled = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success" || checkoutHandled.current) return;
    if (!user?.id) return; // auth still loading — re-run when user is available
    checkoutHandled.current = true;
    params.delete("checkout");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? "?" + qs : ""));
    (async () => {
      try { await base44.functions.invoke("verify-payment", { userId: user.id }); } catch (e) { /* non-fatal */ }
      refreshProfile?.();
      setTimeout(() => refreshProfile?.(), 2000);
      setTimeout(() => refreshProfile?.(), 5000);
      setTimeout(() => refreshProfile?.(), 9000);
    })();
  }, [user?.id]);

  const openPaywall = () => setPaywallOpen(true);
  const closePaywall = () => setPaywallOpen(false);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isComped,
        openPaywall,
        closePaywall,
        planType: profile?.plan_type || "free",
        subscriptionStatus: profile?.subscription_status,
      }}
    >
      {children}
      <PaywallModal open={paywallOpen} onClose={closePaywall} />
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      isPremium: false,
      isComped: false,
      openPaywall: () => {},
      closePaywall: () => {},
      planType: "free",
      subscriptionStatus: null,
    };
  }
  return ctx;
}