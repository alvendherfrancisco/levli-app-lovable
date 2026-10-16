import React from "react";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";
import {
  CHECK_CIRCLE, CHECK_CIRCLE_OFF, CHECK_CIRCLE_ON, LIST_TEXT,
} from "@/lib/uiStyles";

/**
 * One plan, as the slim row the screen chooses between: the radio on the left, the
 * name and its badge in the middle, the price on the right, all inside the 60px
 * row. Three of them stack at equal height, so the choice is read in one glance.
 *
 * The price is one unbroken line: it never wraps and never breaks, whatever the
 * currency does — the amount on the first line, and for the yearly plan its
 * per-month figure in muted text underneath.
 *
 * Chosen, the row takes the flow's own chosen state — the indigo hairline and the
 * soft indigo tint every selected row in the onboarding wears — so the plan in
 * hand is marked the same way a chosen step's options are marked.
 */
export default function PaywallPlanRow({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => { sound.tap(); onSelect(plan.id); }}
      className={`flex h-[60px] w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors ${
        selected
          ? "border-auth-tint-border bg-auth-tint"
          : "border-auth-border bg-auth-card hover:border-auth-hover"
      }`}
    >
      <span
        aria-hidden="true"
        className={`${CHECK_CIRCLE} ${selected ? CHECK_CIRCLE_ON : CHECK_CIRCLE_OFF}`}
      >
        {selected && <Check size={13} strokeWidth={2.5} />}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className={`${LIST_TEXT} truncate`}>{plan.name}</span>
        {plan.badge && (
          <span className="flex-shrink-0 whitespace-nowrap rounded-full bg-auth-tint px-1.5 py-0.5 text-[10px] font-semibold text-auth-link">
            {plan.badge}
          </span>
        )}
      </span>

      <span className="flex-shrink-0 text-right">
        <span className="block whitespace-nowrap text-[15px] font-semibold text-auth-text">
          {plan.price}
          <span className="font-normal text-auth-muted"> {plan.period}</span>
        </span>
        {plan.detail && (
          <span className="block whitespace-nowrap text-[12.5px] leading-tight text-auth-muted">
            {plan.detail}
          </span>
        )}
      </span>
    </button>
  );
}