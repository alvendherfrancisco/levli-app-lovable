import React from "react";
import { Share2, X } from "lucide-react";
import { accessStatus, scopeLabel } from "@/lib/caregiverShare";

const STATUS_LABEL = { pending: "Pending", active: "Active", expired: "Expired", revoked: "Revoked" };

/** "Oct 16" from a stored timestamp — the short form an entry's date reads in. */
const shortDate = (value) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** The line under the address: what level it is, where it stands, and when it
 *  was invited. A pending invite says when it was invited; an active one since
 *  when it has been active. */
function metaLine(entry, status) {
  const invited = shortDate(entry.invited_date || entry.created_date);
  if (status === "active") return `Active · since ${shortDate(entry.granted_date || entry.invited_date)}`;
  if (status === "revoked") return `Revoked · ${shortDate(entry.revoked_date || entry.updated_date)}`;
  if (status === "expired") return `Expired · invited ${invited}`;
  return `Pending · invited ${invited}`;
}

const ACTION = "flex min-h-[44px] items-center gap-1.5 px-2 text-xs font-medium";

/**
 * One entry in the access list: the address it is for on its own line, so a long
 * one is never cut off, and under it where the invite stands with the actions that
 * make sense for that state. A waiting invite can be shared by hand — the message
 * carries the address access is matched to — and anything that still counts for
 * something can be revoked.
 *
 * Nothing is sent by the app itself, so there is no delivery state to report here.
 */
export default function AccessEntry({ entry, onShare, onRevoke }) {
  const status = accessStatus(entry);
  return (
    <div className="text-sm">
      <p className="break-all text-gray-700 dark:text-gray-300">{entry.grantee_email}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">
          {scopeLabel(entry.scope)} · {metaLine(entry, status)}{" "}
          <span className="sr-only">{STATUS_LABEL[status]}</span>
        </p>
        <div className="flex flex-shrink-0 items-center">
          {status === "pending" && onShare && (
            <button type="button" onClick={() => onShare(entry.grantee_email)}
              aria-label={`Share the invite to ${entry.grantee_email}`}
              className={`${ACTION} text-indigo-600 dark:text-indigo-400`}>
              <Share2 size={14} aria-hidden="true" /> Share invite
            </button>
          )}
          {(status === "pending" || status === "active") && onRevoke && (
            <button type="button" onClick={() => onRevoke(entry)}
              aria-label={`Revoke access for ${entry.grantee_email}`}
              className={`${ACTION} text-red-600 dark:text-red-400`}>
              <X size={14} aria-hidden="true" /> Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  );
}