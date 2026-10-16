import React from "react";
import { RefreshCcw, X } from "lucide-react";
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
 * One entry in the access list: who it is for, what level and where it stands,
 * and only the actions that make sense for that state — a resend while an invite
 * is waiting or has run out, and a revoke while it still counts for something.
 */
export default function AccessEntry({ entry, busy = false, onResend, onRevoke }) {
  const status = accessStatus(entry);
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <div className="min-w-0">
        <span className="block truncate text-gray-700 dark:text-gray-300">{entry.grantee_email}</span>
        <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">
          {scopeLabel(entry.scope)} · {metaLine(entry, status)}{" "}
          <span className="sr-only">{STATUS_LABEL[status]}</span>
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center">
        {(status === "pending" || status === "expired") && onResend && (
          <button type="button" onClick={() => onResend(entry)} disabled={busy}
            aria-label={`Resend the invite to ${entry.grantee_email}`}
            className={`${ACTION} text-indigo-600 disabled:opacity-50 dark:text-indigo-400`}>
            <RefreshCcw size={14} aria-hidden="true" /> Resend
          </button>
        )}
        {(status === "pending" || status === "active") && onRevoke && (
          <button type="button" onClick={() => onRevoke(entry)} disabled={busy}
            aria-label={`Revoke access for ${entry.grantee_email}`}
            className={`${ACTION} text-red-600 disabled:opacity-50 dark:text-red-400`}>
            <X size={14} aria-hidden="true" /> Revoke
          </button>
        )}
      </div>
    </div>
  );
}