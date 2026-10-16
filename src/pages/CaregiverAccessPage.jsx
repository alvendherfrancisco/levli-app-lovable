import React, { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import AccessEntry from "@/components/caregiver/AccessEntry";
import { SHEET_FIELD, SHEET_FIELD_SELECT, SHEET_HINT, SHEET_LABEL } from "@/components/modals/shot/sheetUi";
import { useAppState } from "@/lib/AppState";
import { accessStatus, inviteCaregiver, isEmail, SCOPE_OPTIONS } from "@/lib/caregiverShare";
import { sound } from "@/lib/sounds";
import { toast } from "@/lib/toast";

/**
 * Caregiver access — who can see this account's logs, and with what level.
 *
 * Granting sends the invitation straight away, so the screen always reports what
 * happened: the address it went to, or the fact that it could not be sent, with a
 * Retry beside it. An entry that is waiting can be resent, and one that has run
 * out its week says so and can be resent too. Revoking asks first and takes effect
 * at once, on the server.
 */
export default function CaregiverAccessPage() {
  const { proxyAccess, loadProxyAccess, revokeProxyAccess } = useAppState();
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("read");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [failed, setFailed] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const people = proxyAccess.filter((row) => ["pending", "active"].includes(accessStatus(row)));
  const past = proxyAccess.filter((row) => ["revoked", "expired"].includes(accessStatus(row)));

  /** Creates or resends an invite, and reports how it went. Returns the reply so
   *  the caller can clear its own field only when something was actually saved. */
  const runInvite = async (payload) => {
    setSending(true);
    try {
      const data = await inviteCaregiver(payload);
      if (data.error) {
        toast.error(data.message || "That invite could not be created.");
        return data;
      }
      if (data.emailSent) toast.success(`Invite sent to ${data.email}`);
      else setFailed({ email: data.email, accessId: data.accessId, reason: data.emailError });
      await loadProxyAccess();
      return data;
    } catch {
      toast.error("That invite could not be created. Check your connection and try again.");
      return null;
    } finally {
      setSending(false);
      setBusyId("");
    }
  };

  const handleGrant = async () => {
    const address = email.trim();
    if (!isEmail(address)) { toast.error("Enter a valid email address"); return; }
    setFailed(null);
    const data = await runInvite({ email: address, scope });
    if (data && !data.error) setEmail("");
  };

  const handleResend = (entry) => {
    setFailed(null);
    setBusyId(entry.id);
    runInvite({ accessId: entry.id });
  };

  const confirmRevoke = async () => {
    const entry = revoking;
    setRevoking(null);
    if (!entry) return;
    sound.delete();
    try {
      await revokeProxyAccess(entry.id);
      toast.deleted("Access revoked");
    } catch {
      toast.error("That could not be revoked. Try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950">
      <ScreenHeader title="Caregiver access" subtitle="Let someone you trust view your records" />

      <div className="mx-auto max-w-lg pt-2 pb-10">
        {/* Grant access */}
        <div className="mx-3 mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <label className={SHEET_LABEL} htmlFor="caregiver-email">Their email address</label>
          <input
            id="caregiver-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="caregiver@email.com"
            autoComplete="email"
            className={SHEET_FIELD}
          />

          <label className={`${SHEET_LABEL} mt-4`} htmlFor="caregiver-scope">What they can see</label>
          <select id="caregiver-scope" value={scope} onChange={(e) => setScope(e.target.value)} className={SHEET_FIELD_SELECT}>
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button onClick={handleGrant} disabled={sending} className="btn-pill btn-primary mt-4 w-full">
            {sending ? "Sending…" : "Grant Access"}
          </button>

          {/* A send that failed is not a dead end: the invite is saved, and this
              is where it is tried again. */}
          {failed && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  The invite for {failed.email} was saved, but the email could not be sent.
                </p>
              </div>
              {failed.reason && (
                <p className="mt-1 ml-6 text-xs text-amber-700/90 dark:text-amber-300/80">{failed.reason}</p>
              )}
              <button
                onClick={() => { setFailed(null); runInvite({ accessId: failed.accessId }); }}
                disabled={sending}
                className="mt-2 ml-6 text-sm font-semibold text-amber-900 underline disabled:opacity-60 dark:text-amber-200"
              >
                Retry
              </button>
            </div>
          )}

          <p className={`${SHEET_HINT} mt-3`}>
            They'll see your shot, journal, and weight records. You can revoke access anytime.
          </p>
        </div>

        {/* People with access */}
        <div className="mx-3 mb-4">
          <p className="mb-2 px-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">People with access</p>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {people.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-[#9A9DAE]">No one else can see your logs.</p>
            ) : (
              <div className="space-y-3">
                {people.map((entry) => (
                  <AccessEntry
                    key={entry.id}
                    entry={entry}
                    busy={busyId === entry.id || sending}
                    onResend={handleResend}
                    onRevoke={setRevoking}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Past access — revoked and expired entries, folded away until asked for */}
        {past.length > 0 && (
          <div className="mx-3 mb-4">
            <button
              onClick={() => setShowPast((open) => !open)}
              aria-expanded={showPast}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 px-1"
            >
              <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Past access ({past.length})
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showPast ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {showPast && (
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {past.map((entry) => (
                  <AccessEntry
                    key={entry.id}
                    entry={entry}
                    busy={busyId === entry.id || sending}
                    onResend={handleResend}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!revoking}
        title="Revoke access?"
        message={revoking ? `${revoking.grantee_email} loses access straight away and these records disappear from their account.` : ""}
        tone="destructive"
        confirmLabel="Revoke access"
        cancelLabel="Keep access"
        onConfirm={confirmRevoke}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}