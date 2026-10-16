import React from "react";
import { X } from "lucide-react";

/**
 * A longer break, said as a reminder rather than a screenful: how long it has
 * been, what the prescriber may want, and the ways out — log the shot that was
 * missed, say the medication was stopped, or open the prescriber's number when
 * one has been saved.
 *
 * It can be put away. The close button hides it for the day and Snooze for three
 * days; either way it comes back by itself if no dose has been logged (see
 * src/lib/longGapReminder.js), and nothing is written to the account.
 *
 * The card is one of Home's own cards — the same radius, the same hairline and
 * the same margins as the cards around it — and the message sits directly on it,
 * with no box inside a box, so it stays short enough for the card below to stay
 * in view.
 */
export default function LongGapNotice({
  daysSinceLast, onLogPastShot, onStop, stopping, contact, contactHref, onDismiss, onSnooze,
}) {
  const days = `${daysSinceLast} ${daysSinceLast === 1 ? "day" : "days"}`;

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-4 card-line mx-4 mb-4">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Hide this reminder until tomorrow"
        className="absolute right-1.5 top-1.5 w-11 h-11 flex items-center justify-center rounded-full text-gray-400 dark:text-[#9A9DAE] active:opacity-60"
      >
        <X size={18} aria-hidden="true" />
      </button>

      {/* The message takes the card's own surface, and keeps clear of the close
          button's touch target: a headline, then one line. */}
      <h3 className="pr-11 text-base font-bold text-gray-900 dark:text-[#E8E9F0]">
        {days} since your last dose
      </h3>
      <p className="mt-1 pr-11 text-sm text-gray-500 dark:text-[#9A9DAE]">
        Your prescriber may want to review your dose before you continue.
      </p>

      <button type="button" onClick={onLogPastShot} className="btn-pill btn-primary w-full mt-4">
        Log a past shot
      </button>

      {/* The quiet ways out, as words rather than buttons: the one that changes
          the record, and the one that opens the prescriber — offered only when a
          number or an address has actually been saved. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={onStop}
          disabled={stopping}
          className="text-sm font-medium text-gray-500 dark:text-[#9A9DAE] disabled:opacity-60"
        >
          {stopping ? "Saving…" : "I stopped this medication"}
        </button>
        {contact && (
          <a href={contactHref} className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Contact prescriber
          </a>
        )}
      </div>

      <div className="mt-2.5 text-center">
        <button
          type="button"
          onClick={onSnooze}
          className="text-xs font-medium text-gray-400 dark:text-gray-500"
        >
          Snooze 3 days
        </button>
      </div>
    </div>
  );
}