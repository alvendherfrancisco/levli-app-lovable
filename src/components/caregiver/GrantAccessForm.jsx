import React from "react";
import { ChevronDown } from "lucide-react";
import { SHEET_FIELD, SHEET_FIELD_SELECT, SHEET_HINT, SHEET_LABEL } from "@/components/modals/shot/sheetUi";
import { CARD } from "@/lib/cardStyles";
import { SCOPE_OPTIONS, isEmail } from "@/lib/caregiverShare";

/**
 * The grant form: the address, the level, and the one action that saves it. The
 * action stays dimmed until the address is a real one, so a half-typed invite is
 * never sent to the server.
 *
 * Once an invite is saved the card says who it went to and offers the only thing
 * left to do with it — send it — rather than carrying a Share button that would
 * have nothing to share yet.
 */
export default function GrantAccessForm({ email, onEmail, scope, onScope, saving, granted, onGrant, onShare }) {
  return (
    <div className={`${CARD} p-4`}>
      <label className={SHEET_LABEL} htmlFor="caregiver-email">Their email address</label>
      <input
        id="caregiver-email"
        name="caregiver-email"
        type="email"
        inputMode="email"
        autoComplete="off"
        value={email}
        onChange={(event) => onEmail(event.target.value)}
        placeholder="caregiver@email.com"
        className={SHEET_FIELD}
      />

      <label className={`${SHEET_LABEL} mt-4`} htmlFor="caregiver-scope">Access level</label>
      <div className="relative">
        <select
          id="caregiver-scope"
          value={scope}
          onChange={(event) => onScope(event.target.value)}
          className={SHEET_FIELD_SELECT}
        >
          {SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      <button
        type="button"
        onClick={onGrant}
        disabled={saving || !isEmail(email)}
        className="btn-pill btn-primary mt-4 w-full"
      >
        {saving ? "Granting…" : "Grant Access"}
      </button>

      {granted && (
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3.5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
          <p className="break-all text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            Access granted to {granted}
          </p>
          <p className="mt-0.5 text-xs text-indigo-600/90 dark:text-indigo-300/75">
            Send them the invite so they can sign in with this address.
          </p>
          <button type="button" onClick={() => onShare(granted)} className="btn-pill btn-pill-sm btn-secondary mt-3 w-full">
            Share invite
          </button>
        </div>
      )}

      <p className={`${SHEET_HINT} mt-3`}>
        They'll see your shots, journal, and weight after signing in with this email. Revoke anytime.
      </p>
    </div>
  );
}