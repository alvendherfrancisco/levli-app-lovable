import React from "react";
import { Loader2 } from "lucide-react";
import PaywallPlanCard from "@/components/paywall/PaywallPlanCard";

/**
 * The plans to choose between, 12px apart and all the same height, read as one
 * group by a screen reader. While the prices are being fetched the space holds a
 * quiet loading line rather than sample numbers.
 */
export default function PaywallPlans({ plans, selected, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-cardline bg-white p-6 text-sm text-gray-500 dark:bg-gray-900 dark:text-[#9A9DAE]">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        Loading your plans…
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Plans" className="grid gap-3">
      {plans.map((plan) => (
        <PaywallPlanCard key={plan.id} plan={plan} selected={selected === plan.id} onSelect={onSelect} />
      ))}
    </div>
  );
}