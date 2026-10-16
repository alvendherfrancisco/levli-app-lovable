import React from "react";
import InsightSheet from "@/components/insights/InsightSheet";

// What the graph is, in five short lines — said once, where the card's own
// "How this works" opens it. Nothing here suggests taking a dose earlier or
// later than the prescriber's schedule.
const POINTS = [
  "Every dose you log adds the typical shape of one dose to your level, counted from the day you took it. Doses taken on schedule build on each other.",
  "Absorption starts on the day of the dose, so there is no single moment of peak.",
  "The level is a share of the peak of a single dose, so 100% is one dose at its peak. It can go above 100% when doses stack.",
  "The dashed part is a forecast, and it only assumes your next dose is taken on schedule.",
  "Late or missed doses need no correction: the line follows the doses you actually logged.",
  "It is an illustration of a typical pattern, not a measurement of your blood, and not a reason to take a dose early or late.",
];

/** The short explanation the level card's "How this works" opens. */
export default function MedicationLevelHowItWorks({ open, onClose }) {
  return (
    <InsightSheet open={open} onClose={onClose} title="How this works">
      <ul className="space-y-3">
        {POINTS.map((text) => (
          <li key={text} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
            <span className="text-sm leading-relaxed text-gray-600 dark:text-[#C0C3D4]">{text}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-gray-500 dark:text-[#9A9DAE]">
        Every response is different. If you have questions about your level or your schedule, ask your prescriber.
      </p>
    </InsightSheet>
  );
}