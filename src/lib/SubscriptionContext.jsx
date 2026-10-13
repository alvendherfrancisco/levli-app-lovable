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