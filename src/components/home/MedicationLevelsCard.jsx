import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, HelpCircle, Info, Syringe } from "lucide-react";
import ExposureHowItWorks from "@/components/insights/ExposureHowItWorks";
import { useSubscription } from "@/lib/SubscriptionContext";
import { CARD, CARD_TITLE, BODY_TEXT, HELPER_TEXT, INFO_BOX, BTN_PRIMARY } from "@/lib/uiStyles";

/**
 * The modelled medication levels card on Home.
 *
 * One short line says what the number is (and what it is not); the whole
 * explanation lives behind the info mark, in the same sheet Insights opens. On
 * Premium the card opens the chart; without it the card shows the lock, with a
 * short blurred strip of the chart held behind it so the card stays compact.
 */
export default function MedicationLevelsCard() {
  const { isPremium, openPaywall } = useSubscription();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={CARD}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(99,102,241,0.13)" }}
            aria-hidden="true"
          >
            <Syringe size={16} className="text-indigo-600" />
          </span>
          <div className="min-w-0">
            <h3 className={CARD_TITLE}>Medication levels</h3>
            <p className={`${HELPER_TEXT} mt-0.5`}>Estimated, not a blood test.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          aria-label="How this is estimated"
          className="-mr-1 -mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        >
          <HelpCircle size={20} strokeWidth={1.8} className="text-indigo-400" />
        </button>
      </div>

      {isPremium ? (
        <Link to="/insights" className={`${INFO_BOX} mt-4 flex items-center gap-2`}>
          <Info size={16} className="flex-shrink-0" />
          <span className="min-w-0 flex-1">View the full levels chart in Insights</span>
          <ArrowRight size={14} className="flex-shrink-0" />
        </Link>
      ) : (
        <div className="relative mt-4">
          {/* A short piece of the chart, held back behind the lock. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-xl bg-gradient-to-b from-indigo-50 to-transparent opacity-70 blur-[3px] dark:from-indigo-500/10"
          />
          <div className="relative flex flex-col items-center text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/15">
              <Crown size={18} className="text-indigo-600 dark:text-indigo-400" />
            </span>
            <p className={`${CARD_TITLE} mt-2`}>Unlock with Premium</p>
            <p className={`${BODY_TEXT} mt-0.5`}>See estimated levels over time.</p>
            <button type="button" onClick={openPaywall} className={`${BTN_PRIMARY} mt-3`}>Upgrade</button>
          </div>
        </div>
      )}

      <ExposureHowItWorks open={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}