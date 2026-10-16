import React from "react";
import { Activity, FileText, PersonStanding } from "lucide-react";

/**
 * The screen's one visual: the app's own icon at the centre of a soft glow, with
 * three small tiles floating around it — a report page, a body figure with a dot,
 * and a chart line, the three things Premium opens.
 *
 * Flat and minimal, brand purple only, and the same artwork in both modes apart
 * from the glow behind it (pale lavender in light, deep indigo in dark — see the
 * paywall block in src/index.css). It rises in with the screen and then drifts a
 * few pixels at a time; with reduced motion it is simply there.
 */
export default function PaywallHero() {
  return (
    <div className="paywall-hero-in relative mx-auto flex h-[160px] w-full items-center justify-center">
      <div className="paywall-glow absolute inset-x-0 inset-y-2" aria-hidden="true" />

      <div className="paywall-hero-float relative flex items-center justify-center">
        <img
          src="/assets/brand/levli-icon-96.png?v=2"
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 rounded-2xl"
        />

        {/* Left, above the mark: the report that goes to the doctor. */}
        <span className="absolute -left-20 -top-9 flex h-9 w-9 -rotate-6 items-center justify-center rounded-xl border border-cardline bg-white shadow-sm dark:bg-gray-900">
          <FileText size={16} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </span>

        {/* Right, below the mark: the chart of how it is going. */}
        <span className="absolute -right-20 top-6 flex h-9 w-9 rotate-6 items-center justify-center rounded-xl border border-cardline bg-white shadow-sm dark:bg-gray-900">
          <Activity size={16} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </span>

        {/* Under the mark: the body figure, with the dot of a site already used. */}
        <span className="absolute -bottom-9 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-xl border border-cardline bg-white shadow-sm dark:bg-gray-900">
          <PersonStanding size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <span className="absolute left-1/2 top-[36%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-indigo-600 dark:bg-indigo-300" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}