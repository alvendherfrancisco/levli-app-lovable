import React from "react";
import StatusBadge from "@/components/caregiver/StatusBadge";
import { accessStatus, scopeLabel } from "@/lib/caregiverShare";

/** "Oct 16" from a stored timestamp — the short form a date reads in here. */
const shortDate = (value) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** The date beside the badge: when the invite went out, or — once it is over —
 *  when it was revoked or ran out. */
function dateLine(entry, status) {
  const invited = shortDate(entry.invited_date || entry.created_date);
  if (status === "revoked") return `Revoked ${shortDate(entry.revoked_date || entry.updated_date)}`;
  if (status === "expired") return `Expired ${invited}`;
  return `Invited ${invited}`;
}

const ACTION = "inline-flex items-center py-1.5 text-xs font-medium";
const MUTED = "text-xs text-gray-500 dark:text-[#9A9DAE]";

/**
 * One entry in the access list: the whole address on its own line — a long one is
 * never cut off — then where it stands and when, and finally the two things that
 * can be done with it, as plain text buttons. A waiting invite can be sent by
 * hand (the message carries the address access is matched to); anything that
 * still counts for something can be revoked.
 *
 * An entry that is over is shown the same way without the buttons: its state and
 * date read in muted text where the badge would be.
 *
 * Nothing is sent by the app itself, so there is no delivery state to report.
 */
export default function AccessEntry({ entry, onShare, onRevoke, showScope = false }) {
  const status = accessStatus(entry);
  const isPast = status === "revoked" || status === "expired";
  const canShare = status === "pending" && !!onShare;
  const canRevoke = !isPast && !!onRevoke;

  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <p className={`break-all text-sm ${isPast ? "text-gray-600 dark:text-[#9A9DAE]" : "font-medium text-gray-900 dark:text-[#E8E9F0]"}`}>
        {entry.grantee_email}
      </p>

      {isPast ? (
        <p className={`mt-1 ${MUTED}`}>{dateLine(entry, status)}</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={status} />
          <span className={MUTED}>
            {showScope ? `${scopeLabel(entry.scope)} · ` : ""}{dateLine(entry, status)}
          </span>
        </div>
      )}

      {(canShare || canRevoke) && (
        <div className="mt-1.5 flex items-center gap-4">
          {canShare && (
            <button
              type="button"
              onClick={() => onShare(entry.grantee_email)}
              aria-label={`Share the invite to ${entry.grantee_email}`}
              className={`${ACTION} text-indigo-600 dark:text-indigo-400`}
            >
              Share invite
            </button>
          )}
          {canRevoke && (
            <button
              type="button"
              onClick={() => onRevoke(entry)}
              aria-label={`Revoke access for ${entry.grantee_email}`}
              className={`${ACTION} text-red-600 dark:text-red-400`}
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  );
}