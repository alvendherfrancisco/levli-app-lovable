import React from "react";
import StatusBadge from "@/components/caregiver/StatusBadge";
import { accessStatus, scopeLabel } from "@/lib/caregiverShare";

/** "Oct 16" from a stored timestamp — the short form a date reads in here. */
const shortDate = (value) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** The date beside the badge: when the invite went out, when it was taken up, or
 *  — once it is over — when it was revoked or ran out. */
function dateLine(entry, status) {
  const invited = shortDate(entry.invited_date || entry.created_date);
  if (status === "revoked") return `Revoked ${shortDate(entry.revoked_date || entry.updated_date)}`;
  if (status === "expired") return `Expired ${shortDate(entry.expires_at) || invited}`;
  if (status === "active") return `Active since ${shortDate(entry.granted_date) || invited}`;
  return `Invited ${invited}`;
}

const MUTED = "text-xs text-gray-500 dark:text-[#9A9DAE]";

/** The one action a waiting or live entry has: red words inside a red outline,
 *  as tall as a touch target, with no icon to read first. */
const REVOKE_BUTTON =
  "inline-flex min-h-[44px] flex-shrink-0 items-center justify-center rounded-full border " +
  "border-red-200 bg-white px-5 text-sm font-medium text-red-600 transition-colors " +
  "active:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:active:bg-red-500/10";

/**
 * One entry in the access list, read left to right: who it is and where the
 * access stands, then the one thing that can be done about it.
 *
 * On the left the whole address sits on its own line — a long one is never cut
 * off — and beneath it the state as a badge with its date beside it in muted
 * text. On the right, where the thumb already is, Revoke.
 *
 * An entry that is over keeps the same left side without the badge — its state
 * and date are already the whole story — and carries no action at all.
 *
 * Nothing is sent by the app itself, so there is no delivery state to report.
 */
export default function AccessEntry({ entry, onRevoke, showScope = false }) {
  const status = accessStatus(entry);
  const isPast = status === "revoked" || status === "expired";
  const canRevoke = !isPast && !!onRevoke;

  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="min-w-0 flex-1">
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
      </div>

      {canRevoke && (
        <button
          type="button"
          onClick={() => onRevoke(entry)}
          aria-label={`Revoke access for ${entry.grantee_email}`}
          className={REVOKE_BUTTON}
        >
          Revoke
        </button>
      )}
    </div>
  );
}