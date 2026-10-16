import React from "react";
import { Loader2 } from "lucide-react";
import PaywallPlanCard from "@/components/paywall/PaywallPlanCard";

/**
 * The plans to choose between: three slim cards in one row, 12px apart, all the
 * same height, read as one group by a screen reader. Three across is what makes
 * them comparable at a glance and keeps the screen to a single view.
 *
 * While the prices are being read, the row holds a quiet loading line rather than
 * sample numbers.
 */
export default function PaywallPlans({ plans, selected, onSelect, loading }) {
  return (
    <div className="mt-6">
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-cardline bg-white p-4 text-sm text-gray-500 dark:bg-gray-900 dark:text-[#9A9DAE]">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          Loading your plans…
        </div>
      ) : (
        <div role="radiogroup" aria-label="Plans" className="grid grid-cols-3 gap-3">
          {plans.map((plan) => (
            <PaywallPlanCard key={plan.id} plan={plan} selected={selected === plan.id} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}