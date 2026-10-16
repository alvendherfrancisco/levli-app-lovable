import React from "react";
import { Loader2 } from "lucide-react";
import PaywallPlanRow from "@/components/paywall/PaywallPlanRow";

/**
 * The plans, one slim row each, 12px apart and all the same height, read as one
 * group by a screen reader. Nothing is drawn around them: the rows are the block,
 * so the screen keeps its air and the button underneath stays the thing in focus.
 *
 * While the prices are being read, the block holds a quiet loading line in the
 * flow's own muted text rather than sample numbers.
 */
export default function PaywallPlans({ plans, selected, onSelect, loading, className = "" }) {
  if (loading) {
    return (
      <p className={`flex items-center justify-center gap-2 text-[15px] text-auth-muted ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading your plans…
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Plans" className={`space-y-3 ${className}`}>
      {plans.map((plan) => (
        <PaywallPlanRow
          key={plan.id}
          plan={plan}
          selected={selected === plan.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}