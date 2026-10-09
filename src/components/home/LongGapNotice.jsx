import React from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, PauseCircle, PhoneCall } from "lucide-react";

/**
 * A longer break: the schedule itself is no longer shown (a due date weeks in
 * the past is not an upcoming shot), and the three real options are offered.
 */
export default function LongGapNotice({
  daysSinceLast, onLogPastShot, onStop, stopping, contact, contactHref,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
      <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 border border-transparent dark:border-indigo-500/15">
        <p className="text-sm text-indigo-700 dark:text-indigo-300">
          You haven't logged a dose in {daysSinceLast} days. After a longer break, your prescriber may want to review your dose before you continue.
        </p>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={onLogPastShot}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          <CalendarPlus size={16} /> Log a past shot
        </button>
        <button
          onClick={onStop}
          disabled={stopping}
          className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <PauseCircle size={16} /> {stopping ? "Saving…" : "I stopped this medication"}
        </button>
        {contact ? (
          <a
            href={contactHref}
            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <PhoneCall size={16} /> Contact prescriber
          </a>
        ) : (
          <Link
            to="/profile"
            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <PhoneCall size={16} /> Contact prescriber
          </Link>
        )}
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        {contact
          ? `Opens ${contact}.`
          : "No prescriber phone or email saved yet. Add one in Profile and this button opens it."}
      </p>
    </div>
  );
}