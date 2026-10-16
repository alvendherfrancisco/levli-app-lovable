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
import { mostRecentSite, shotsInSiteWindow, siteKey, siteSkewHint, siteUsage } from "@/lib/injectionSites";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";

const RANGES = { "7 Days": 7, "30 Days": 30, "90 Days": 90 };
const NINETY_DAYS = RANGES["90 Days"];

/**
 * Where the shots went over the last 7, 30 or 90 days — the panel that sits under
 * the shot history it describes.
 *
 * The figures are centred between equal margins and grow with the card, the tabs
 * below the header run the full card width so they line up with them, and the
 * card is only as tall as what it holds: the sites below the body, then the tip.
 */
export default function InjectionSiteCard() {
  const { shots } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const [range, setRange] = useState("30 Days");
  const [openSite, setOpenSite] = useState(null);
  // The site in hand: its row in the list and its dot on the figure are marked
  // together, so the two always read as the one thing.
  const [selectedSite, setSelectedSite] = useState(null);

  const entries = useMemo(() => shotsInSiteWindow(shots, RANGES[range]), [shots, range]);
  const usage = useMemo(() => siteUsage(entries), [entries]);
  const recentSite = useMemo(() => mostRecentSite(usage), [usage]);
  const hint = useMemo(() => siteSkewHint(usage), [usage]);
  // The longer range is offered only where it has something to show.
  const ninetyDays = useMemo(() => shotsInSiteWindow(shots, NINETY_DAYS), [shots]);

  // A row's site is the site's fixed id (see src/lib/injectionSites.js), so the
  // entries behind it are the ones filed under that same site. Tapping its dot or
  // its row marks both and opens the entries.
  const openEntries = (site) => {
    setSelectedSite(site);
    setOpenSite({ site, entries: entries.filter((s) => siteKey(s.site) === site) });
  };

  return (
    <InsightCard>
      <SectionHeader
        compact
        icon={<IonIcon name="location" size={16} className="text-indigo-600 dark:text-indigo-400" />}
        title="Injection Site Rotation"
      />

      {/* A new range is a new set of sites, so nothing stays marked from the old one. */}
      <RangeTabs
        options={Object.keys(RANGES)}
        value={range}
        onChange={(next) => { setRange(next); setSelectedSite(null); }}
      />

      <div className="relative">
        <div className={isPremium ? "" : "blur-sm pointer-events-none select-none opacity-60"}>
          <div className="mx-auto w-full max-w-[280px]">
            <BodyOutline
              usage={usage}
              recentSite={recentSite}
              selectedSite={selectedSite}
              onSelectSite={openEntries}
              className="h-auto w-full"
            />
          </div>

          {usage.length === 0 ? (
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
          ) : (
            <div className="mt-4">
              <SiteUsageList usage={usage} selectedSite={selectedSite} onSelectSite={openEntries} />
            </div>
          )}

          {/* A suggestion, never a warning: one quiet line, kept close under the
              list it is about. */}
          {hint && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#9A9DAE]">
              <Info size={13} className="flex-shrink-0" aria-hidden="true" />
              {hint}
            </p>
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

      <p className={`mt-3 text-center ${FOOTNOTE}`}>Rotate sites to support absorption and reduce irritation.</p>

      <SiteEntriesSheet
        open={!!openSite}
        site={openSite ? openSite.site : ""}
        entries={openSite ? openSite.entries : []}
        onClose={() => setOpenSite(null)}
      />
    </InsightCard>
  );
}