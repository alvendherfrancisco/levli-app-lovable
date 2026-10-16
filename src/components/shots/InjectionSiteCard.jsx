import React, { useMemo, useState } from "react";
import { Crown, Info } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import RangeTabs from "@/components/insights/RangeTabs";
import BodyOutline from "@/components/shots/BodyOutline";
import SiteUsageList from "@/components/shots/SiteUsageList";
import SiteEntriesSheet from "@/components/shots/SiteEntriesSheet";
import { FOOTNOTE } from "@/components/insights/insightUi";
import { mostRecentSite, shotsInSiteWindow, siteSkewHint, siteUsage } from "@/lib/injectionSites";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";

const RANGES = { "7 Days": 7, "30 Days": 30, "90 Days": 90 };
const NINETY_DAYS = RANGES["90 Days"];

/**
 * Where the shots have been given over the last 7, 30 or 90 days — the panel
 * that used to sit on Insights, now shown under the shot history it describes.
 *
 * The body outline is the same drawing whether or not a range has anything to
 * show, and the panel around it keeps one height on every range, so choosing
 * another tab never moves the page; only its contents change.
 */
export default function InjectionSiteCard() {
  const { shots } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const [range, setRange] = useState("30 Days");
  const [openSite, setOpenSite] = useState(null);

  const entries = useMemo(() => shotsInSiteWindow(shots, RANGES[range]), [shots, range]);
  const usage = useMemo(() => siteUsage(entries), [entries]);
  const recentSite = useMemo(() => mostRecentSite(usage), [usage]);
  const hint = useMemo(() => siteSkewHint(usage), [usage]);
  // The longer range is offered only where it has something to show.
  const ninetyDays = useMemo(() => shotsInSiteWindow(shots, NINETY_DAYS), [shots]);

  const openEntries = (site) =>
    setOpenSite({ site, entries: entries.filter((s) => s.site === site) });

  return (
    <InsightCard>
      <SectionHeader
        compact
        icon={<IonIcon name="location" size={16} className="text-indigo-600 dark:text-indigo-400" />}
        title="Injection Site Rotation"
      />

      <RangeTabs variant="segmented" options={Object.keys(RANGES)} value={range} onChange={setRange} className="mb-4" />

      <div className="relative">
        <div className={isPremium ? "" : "blur-sm pointer-events-none select-none opacity-60"}>
          {/* One height on every range, so the page never jumps between tabs. */}
          <div className="flex h-[300px] flex-col">
            <div className="flex h-[150px] shrink-0 items-center justify-center">
              <BodyOutline usage={usage} recentSite={recentSite} onSelectSite={openEntries} />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar">
              {usage.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <InsightEmptyState
                    message="No shots in this range"
                    action={
                      ninetyDays.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setRange("90 Days")}
                          className="btn-link min-h-[44px] px-2 text-xs"
                        >
                          View last 90 days
                        </button>
                      ) : null
                    }
                  />
                </div>
              ) : (
                <SiteUsageList usage={usage} recentSite={recentSite} onSelectSite={openEntries} />
              )}
            </div>

            {/* A suggestion, never a warning: one quiet line, and only when one
                site is genuinely carrying the rotation. */}
            {hint && (
              <p className="mt-2 flex shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-[#9A9DAE]">
                <Info size={13} className="flex-shrink-0" aria-hidden="true" />
                {hint}
              </p>
            )}
          </div>
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

      <SiteEntriesSheet
        open={!!openSite}
        site={openSite ? openSite.site : ""}
        entries={openSite ? openSite.entries : []}
        onClose={() => setOpenSite(null)}
      />
    </InsightCard>
  );
}