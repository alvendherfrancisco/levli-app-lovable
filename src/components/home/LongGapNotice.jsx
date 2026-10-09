import React from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, PauseCircle, PhoneCall } from "lucide-react";
import { CARD, HELPER_TEXT, INFO_BOX, BTN_PRIMARY_WIDE, BTN_QUIET } from "@/lib/uiStyles";

/**
 * A longer break: the schedule itself is no longer shown (a due date weeks in
 * the past is not an upcoming dose), and the three real options are offered.
 */
export default function LongGapNotice({
  daysSinceLast, onLogPastShot, onStop, stopping, contact, contactHref,
}) {
  return (
    <div className={CARD}>
      <div className={INFO_BOX}>
        You haven't logged a dose in {daysSinceLast} days. After a longer break, your prescriber may want to review your dose before you continue.
      </div>

      <div className="mt-4 space-y-2">
        <button onClick={onLogPastShot} className={BTN_PRIMARY_WIDE}>
          <CalendarPlus size={16} aria-hidden="true" /> Log a past dose
        </button>
        <button
          onClick={onStop}
          disabled={stopping}
          className={`${BTN_QUIET} w-full disabled:opacity-60`}
        >
          <PauseCircle size={16} aria-hidden="true" /> {stopping ? "Saving…" : "I stopped this medication"}
        </button>
        {contact ? (
          <a href={contactHref} className={`${BTN_QUIET} w-full`}>
            <PhoneCall size={16} aria-hidden="true" /> Contact prescriber
          </a>
        ) : (
          <Link to="/profile" className={`${BTN_QUIET} w-full`}>
            <PhoneCall size={16} aria-hidden="true" /> Contact prescriber
          </Link>
        )}
      </div>

      <p className={`${HELPER_TEXT} mt-2`}>
        {contact
          ? `Opens ${contact}.`
          : "No prescriber phone or email saved yet. Add one in Profile and this button opens it."}
      </p>
    </div>
  );
}