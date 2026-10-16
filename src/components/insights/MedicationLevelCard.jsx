import React, { useMemo, useState } from "react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import RangeTabs from "@/components/insights/RangeTabs";
import { FOOTNOTE } from "@/components/insights/insightUi";
import MedicationLevelChart from "@/components/insights/MedicationLevelChart";
import LevelMedicationPicker from "@/components/insights/LevelMedicationPicker";
import MedicationLevelHowItWorks from "@/components/insights/MedicationLevelHowItWorks";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import PremiumBadge from "@/components/PremiumBadge";
import PremiumLockedBlock from "@/components/premium/PremiumLockedBlock";
import LockedLevelPreview from "@/components/insights/LockedLevelPreview";
import useDoseColors from "@/hooks/useDoseColors";
import { medicationSummaries } from "@/lib/medicationLink";
import {
  DEFAULT_LEVEL_RANGE, LEVEL_RANGES, PHASE_TONE, buildMedicationLevel, defaultLevelMedication,
  levelMedicationOptions,
} from "@/lib/medicationLevel";

/** The card's caveat, word for word as it is meant to be read. One short line:
 *  what is not explained here is in the card's "How this works" sheet. */
const DISCLAIMER = "Estimate only. Not a blood test or dosing advice.";

/**
 * Medication Level — what one dose's typical shape adds up to on any day, from the
 * doses actually logged.
 *
 * The figure is a share of the peak of a single dose, so it passes 100% as doses
 * build on each other; it is a drawing of a typical pattern, never a blood test.
 * The card reads the same dose data as the Shots screen, so logging, editing or
 * deleting a dose — a past one included — redraws it at once.
 *
 * A product the app has no curve for (a tablet, a peptide) has no card: the one
 * line in its place says so.
 */
export default function MedicationLevelCard() {
  const { shots, medications, repeatSchedules, profile } = useAppState();
  // The whole figure is Premium, so the card is either the real chart or the
  // lock — decided by the subscription, which clears the lock the moment a
  // purchase or a restore lands.
  const { isPremium } = useSubscription();
  const locked = !isPremium;
  const { isDark } = useDoseColors();
  const tickFill = isDark ? "#B4B8C7" : "#767676";

  const [range, setRange] = useState(DEFAULT_LEVEL_RANGE);
  const [chosenId, setChosenId] = useState(null);
  const [howOpen, setHowOpen] = useState(false);

  // The medications the app can draw for this account.
  const options = useMemo(
    () => levelMedicationOptions({ medications, shots, profile }),
    [medications, shots, profile],
  );

  // The one in hand: the chosen medication, or — the first time the card is
  // drawn — the one with the most recent dose logged.
  const chosen = useMemo(
    () => options.find((option) => option.id === chosenId) || defaultLevelMedication(options, shots),
    [options, chosenId, shots],
  );

  // Its own schedule, which is what the forecast assumes the next dose follows.
  const summary = useMemo(() => {
    if (!chosen?.medication?.id) return null;
    return medicationSummaries({ medications, shots, repeatSchedules, profile })
      .find((entry) => entry.medication?.id === chosen.medication.id) || null;
  }, [chosen, medications, shots, repeatSchedules, profile]);

  const level = useMemo(() => buildMedicationLevel({
    shots,
    medication: chosen?.medication,
    rangeDays: LEVEL_RANGES[range],
    nextDoseKey: summary?.nextKey || null,
    intervalDays: summary?.intervalDays || null,
  }), [shots, chosen, range, summary]);

  if (!options.length) {
    return (
      <InsightCard>
        <SectionHeader
          icon={<IonIcon name="pulse" size={20} className="text-indigo-600 dark:text-indigo-400" />}
          title="Medication Level"
        />
        <p className="text-sm text-gray-500 dark:text-[#9A9DAE]">
          Level tracking isn&rsquo;t available for this medication yet.
        </p>
      </InsightCard>
    );
  }

  const percent = level.hasDoses ? Math.round(level.today.level) : null;
  const daysSince = level.today?.daysSinceLast;
  const ariaLabel = level.hasDoses
    ? `Medication level chart. Today ${percent}% of a single-dose peak.`
    : "Example medication level chart";

  return (
    <InsightCard id="medication-level" className="overflow-hidden scroll-mt-24">
      <SectionHeader
        icon={<IonIcon name="pulse" size={20} className="text-indigo-600 dark:text-indigo-400" />}
        title="Medication Level"
        action={locked
          ? <PremiumBadge />
          : options.length > 1
            ? <LevelMedicationPicker options={options} value={chosen?.id} onChange={setChosenId} />
            : null}
      />

      {locked ? (
        /* Locked: the figure, the range and the note are not drawn at all — the
           block stands the card's own layout in sample shapes (see
           LockedLevelPreview), so nothing of the person's level is in the page to
           be read through the blur. "How this works" stays live below it: it
           explains the feature and shows nothing of their own. */
        <PremiumLockedBlock>
          <LockedLevelPreview />
        </PremiumLockedBlock>
      ) : (
        <>
      {/* Today, before the graph: the level in hand, the phase it is in beside
          the heading, and what the figure is measured against on a row of its
          own — so the badge never squeezes that line. */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-[#9A9DAE]">Today</p>
          {level.hasDoses && level.today.phase && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${PHASE_TONE[level.today.phase]}`}>
              {level.today.phase}
            </span>
          )}
        </div>
        {level.hasDoses ? (
          <>
            <p className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">{percent}%</p>
            {/* Full card width, one line always: it shrinks rather than wrapping. */}
            <p className="mt-0.5 min-w-0 shrink whitespace-nowrap text-[13px] text-gray-500 dark:text-[#9A9DAE]">
              of single-dose peak
              {daysSince > 0 ? ` · day ${daysSince} after dose` : ""}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray-500 dark:text-[#9A9DAE]">Log your first dose to see your level.</p>
        )}
      </div>

      <RangeTabs options={Object.keys(LEVEL_RANGES)} value={range} onChange={setRange} />

      {level.supported && (
        <MedicationLevelChart
          points={level.points}
          tickFill={tickFill}
          example={!level.hasDoses}
          ariaLabel={ariaLabel}
        />
      )}

      {/* What the graph is drawn with, in the sheet's own wording. */}
      {level.hasDoses && level.today.note && (
        <p className="mt-3 rounded-xl bg-indigo-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {level.today.note}
        </p>
      )}

      <p className={`mt-3 text-center ${FOOTNOTE}`}>{DISCLAIMER}</p>
        </>
      )}

      {/* Centred on the card's own axis: the row takes the full width and the
          link keeps its colour, weight and size. */}
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => setHowOpen(true)} className="btn-link text-sm">
          How this works
        </button>
      </div>

      <MedicationLevelHowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
    </InsightCard>
  );
}