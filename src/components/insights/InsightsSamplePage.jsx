import React from "react";
import IonIcon from "@/components/IonIcon";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import StatTile from "@/components/insights/StatTile";
import LockedWeightChartPreview from "@/components/insights/LockedWeightChartPreview";
import LockedLevelPreview from "@/components/insights/LockedLevelPreview";
import LockedSideEffectsPreview from "@/components/insights/LockedSideEffectsPreview";
import LockedPhotosPreview from "@/components/insights/LockedPhotosPreview";

/**
 * The Insights page as a picture: the same cards, in the same order, on the same
 * 16px margins, the same surfaces and the same corner radius as the real page —
 * the weight summary with its four tinted tiles and its chart, Medication Level,
 * Side Effects and Progress Pictures.
 *
 * It is drawn to be recognised, not to be read: the blur over it is light, so the
 * tiles keep their teal, indigo, purple and orange, the charts keep their lines and
 * the strip keeps its tiles. Nothing on it is real. The values are made up for the
 * picture ("-18.6 lb", "-9.4%", "72%"), the chart lines, dose markers and photo
 * tiles are shapes, the symptoms named are the app's own checklist words, and there
 * is no button, toggle or dropdown anywhere on the page — so nothing behind the
 * lock can be pressed, focused or read out. It reads no data of any kind: no store,
 * no profile, no records, so nothing of the person's own is in the page to be found
 * through the blur, a screenshot, or an accessibility tool.
 */
const SAMPLE_RANGES = ["30 Days", "180 Days", "1 Year", "Since start"];

export default function InsightsSamplePage() {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4">
      <InsightCard>
        <SectionHeader
          icon={<IonIcon name="trending-down" size={20} className="text-indigo-600 dark:text-indigo-400" />}
          title="Weight Change"
        />

        {/* The range row, as the real card draws it: the range in hand is the
            indigo pill and the rest are quiet words, with nothing to press. */}
        <div className="mb-5 flex flex-wrap items-center gap-1">
          {SAMPLE_RANGES.map((label, index) => (
            <span
              key={label}
              className={`flex min-h-[38px] min-w-[4.25rem] flex-1 items-center justify-center whitespace-nowrap rounded-full px-1.5 text-[11px] font-medium sm:px-2.5 sm:text-xs ${
                index === 1 ? "bg-indigo-600 text-white" : "text-gray-500 dark:text-[#9A9DAE]"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <StatTile tone="teal" icon="arrow-down-circle" label="Weight Loss" value="-18.6 lb" />
          <StatTile tone="indigo" icon="flash" label="% Change" value="-9.4%" />
          <StatTile tone="purple" icon="time" label="Rate/Week" value="-0.8 lb" />
          <StatTile tone="orange" icon="speedometer" label="Current BMI" value="27.6" />
        </div>

        <LockedWeightChartPreview />
      </InsightCard>

      <InsightCard>
        <SectionHeader
          icon={<IonIcon name="pulse" size={20} className="text-indigo-600 dark:text-indigo-400" />}
          title="Medication Level"
        />
        <LockedLevelPreview />
      </InsightCard>

      <InsightCard>
        <SectionHeader
          compact
          icon={<IonIcon name="warning" size={16} className="text-indigo-600 dark:text-indigo-400" />}
          title="Side Effects"
        />
        <LockedSideEffectsPreview />
      </InsightCard>

      <InsightCard>
        <SectionHeader
          icon={<IonIcon name="camera" size={20} className="text-indigo-600 dark:text-indigo-400" />}
          title="Progress Pictures"
        />
        <LockedPhotosPreview />
      </InsightCard>
    </div>
  );
}