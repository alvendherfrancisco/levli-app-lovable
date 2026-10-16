import React, { useState } from "react";
import { Crown } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import RangeTabs from "@/components/insights/RangeTabs";
import SiteRotationChart from "@/components/insights/SiteRotationChart";
import { FOOTNOTE } from "@/components/insights/insightUi";
import { parseShotDate } from "@/lib/dateUtils";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";

const RANGES = { "7 Days": 7, "30 Days": 30, "90 Days": 90 };

/**
 * Where the shots have been given over the last 7, 30 or 90 days — the panel
 * that used to sit on Insights, now shown under the shot history it describes.
 * The range tabs and the premium gate it had there are unchanged.
 */
export default function InjectionSiteCard() {
  const { shots } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const [range, setRange] = useState("30 Days");

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const shotsInRange = shots.filter((s) => {
    const sd = parseShotDate(s.date);
    if (!sd) return false;
    const daysSince = Math.round((startOfToday - sd) / 86400000);
    return daysSince >= 0 && daysSince <= RANGES[range];
  }).length;

  return (
    <InsightCard>
      <SectionHeader
        icon={<IonIcon name="location" size={20} className="text-indigo-600 dark:text-indigo-400" />}
        title="Injection Site Rotation"
      />

      <RangeTabs options={Object.keys(RANGES)} value={range} onChange={setRange} />

      <div className="relative">
        <div className={isPremium ? "" : "blur-sm pointer-events-none select-none opacity-60"}>
          {shotsInRange === 0 ? (
            <InsightEmptyState
              message="No shots in this range."
              // A longer range is only offered while a shorter one is showing.
              action={range !== "90 Days" ? (
                <button onClick={() => setRange("90 Days")} className="btn-pill btn-pill-sm btn-primary">
                  View last 90 days
                </button>
              ) : null}
            />
          ) : (
            <SiteRotationChart shots={shots} range={RANGES[range]} />
          )}
        </div>
        {!isPremium && (
          <button onClick={openPaywall} className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
              <Crown size={26} className="text-indigo-600" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">Unlock with Levli Premium</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">Upgrade to premium to view your injection site rotation.</p>
          </button>
        )}
      </div>
      <p className={`mt-4 text-center ${FOOTNOTE}`}>Rotate sites to support absorption and reduce irritation.</p>
    </InsightCard>
  );
}