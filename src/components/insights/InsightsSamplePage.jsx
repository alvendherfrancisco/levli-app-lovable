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
 * the weight summary with its four tiles, the weight chart, Medication Level, Side
 * Effects and Progress Pictures.
 *
 * Nothing on it is real. Every value is made up for the picture ("-18.6 lb",
 * "-9.4%"), the chart lines, dose markers and photo tiles are shapes, and there is
 * no button, toggle or dropdown anywhere on the page — so nothing behind the lock
 * can be pressed, focused or read out. It reads no data of any kind: no store, no
 * profile, no records, so nothing of the person's own is in the page to be found
 * through the blur, a screenshot, or an accessibility tool.
 */
const SAMPLE_TABS = ["30 Days", "180 Days", "1 Year", "Since start"];

export default function InsightsSamplePage() {
  return (
    <div className="w-full max-w-3xl mx-auto pt-4">
      <InsightCard>
        <SectionHeader
          icon={<IonIcon name="trending-down" size={20} className="text-indigo-600 dark:text-indigo-400" />}
          title="Weight Change"
        />

        {/* The range row, as shapes: the real tabs' height and pill, with nothing
            to press. */}
        <div className="mb-4 flex gap-1">
          {SAMPLE_TABS.map((label, index) => (
            <span
              key={label}
              className={`inline-flex h-[38px] flex-1 items-center justify-center rounded-full text-[13px] font-medium ${
                index === 1
                  ? "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500"
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