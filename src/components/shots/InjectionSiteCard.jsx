import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import RangeTabs from "@/components/insights/RangeTabs";
import PremiumBadge from "@/components/PremiumBadge";
import BodyOutline from "@/components/shots/BodyOutline";
import SiteUsageList from "@/components/shots/SiteUsageList";
import SiteEntriesSheet from "@/components/shots/SiteEntriesSheet";
import LockedSitesPreview from "@/components/shots/LockedSitesPreview";
import SiteRotationLock from "@/components/shots/SiteRotationLock";
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
 * The card has two states, and draws both with the same shell, header, padding and
 * margins as every other card on the screen:
 *
 * · unlocked — the figures are centred between equal margins and grow with the
 *   card, the tabs below the header run the full card width so they line up with
 *   them, and the tip sits under the sites it is about.
 * · locked — the same panel, drawn from sample sites and held behind a light
 *   dimming blur, with one compact lock over it carrying the app's icon, what the
 *   feature is for and the way into the plans. The preview stays there to be seen
 *   for the rest of the session, and takes no tap and no scroll while it is
 *   locked.
 *
 * Premium accounts and the caregiver read-only view never see the lock: the first
 * has nothing left to unlock, and the second reads the records it was shared on
 * the caregiver's own screen.
 */
export default function InjectionSiteCard() {
  const { shots } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const [range, setRange] = useState("30 Days");
  const [openSite, setOpenSite] = useState(null);
  // The site in hand: its row in the list and its dot on the figure are marked
  // together, so the two always read as the one thing.
  const [selectedSite, setSelectedSite] = useState(null);

  const locked = !isPremium;

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
        action={locked ? <PremiumBadge /> : null}
      />

      {/* A range only narrows a chart that can be read: while the chart is
          locked the tabs would change something nobody can see. */}
      {!locked && (
        <RangeTabs
          options={Object.keys(RANGES)}
          value={range}
          onChange={(next) => { setRange(next); setSelectedSite(null); }}
        />
      )}

      <div className="relative">
        {locked ? (
          <LockedSitesPreview />
        ) : (
          <>
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

            {/* A suggestion, never a warning: one quiet line, kept close under
                the list it is about. */}
            {hint && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#9A9DAE]">
                <Info size={13} className="flex-shrink-0" aria-hidden="true" />
                {hint}
              </p>
            )}
          </>
        )}

        {locked && <SiteRotationLock onUnlock={openPaywall} />}
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