import React from "react";
import { useSubscription } from "@/lib/SubscriptionContext";
import LevliLockIcon from "@/components/premium/LevliLockIcon";

export default function LockedFeatureCard({
  title = "Unlock with Levli Premium",
  subtitle = "Upgrade to premium to view this feature.",
  children,
}) {
  const { openPaywall } = useSubscription();
  return (
    <div className="relative">
      {children && (
        <div className="pointer-events-none select-none blur-sm opacity-50">{children}</div>
      )}
      <button
        onClick={openPaywall}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
      >
        <LevliLockIcon className="mb-3" />
        <p className="font-bold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{subtitle}</p>
      </button>
    </div>
  );
}