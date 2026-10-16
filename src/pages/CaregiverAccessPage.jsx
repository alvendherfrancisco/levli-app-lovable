import React, { useState } from "react";
import { ChevronDown, Share2 } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import AccessEntry from "@/components/caregiver/AccessEntry";
import { SHEET_FIELD, SHEET_FIELD_SELECT, SHEET_HINT, SHEET_LABEL } from "@/components/modals/shot/sheetUi";
import { useAppState } from "@/lib/AppState";
import { accessStatus, inviteCaregiver, isEmail, SCOPE_OPTIONS, shareInvite } from "@/lib/caregiverShare";
import { sound } from "@/lib/sounds";
import { toast } from "@/lib/toast";

/**
 * Caregiver access — who can see this account's logs, and with what level.
 *
 * Granting saves the invite as pending and names the address it was granted to.
 * Nothing leaves the app: the person who granted it shares the invite themselves,
 * either straight after granting or from any entry that is still waiting, and the
 * invite becomes active by itself the first time that exact address signs in.
 * Revoking asks first and takes effect at once, on the server.
 */
export default function CaregiverAccessPage() {
  const { proxyAccess, loadProxyAccess, revokeProxyAccess } = useAppState();
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("read");
  const [saving, setSaving] = useState(false);
  // The address just granted, so its own Share invite button can sit under the
  // form without anyone having to type it in again.
  const [granted, setGranted] = useState("");
  const [revoking, setRevoking] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const people = proxyAccess.filter((row) => ["pending", "active"].includes(accessStatus(row)));
  const past = proxyAccess.filter((row) => ["revoked", "expired"].includes(accessStatus(row)));

  /** Grants access to one address. Nothing is sent: the invite is saved and waits
   *  for that exact address to sign in. */
  const handleGrant = async () => {
    const address = email.trim();
    if (!isEmail(address)) { toast.error("Enter a valid email address"); return; }
    setSaving(true);
    try {
      const data = await inviteCaregiver({ email: address, scope });
      if (data.error) {
        toast.error(data.message || "That invite could not be created.");
        return;
      }
      toast.success(`Access granted to ${data.email}`);
      setGranted(data.email);
      setEmail("");
      await loadProxyAccess();
    } catch {
      toast.error("That invite could not be created. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  /** Hands the invite to the phone's own share sheet, so it can go out through
   *  anything the person already uses. */
  const handleShare = async (address) => {
    const how = await shareInvite(address);
    if (how === "copied") toast.success("Invite copied. Paste it into a message to send it.");
    else if (how === "unavailable") toast.error("That invite could not be shared here.");
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

          <button onClick={handleGrant} disabled={saving} className="btn-pill btn-primary mt-4 w-full">
            {saving ? "Granting…" : "Grant Access"}
          </button>

          {/* Sharing the invite is the person's own step: the address is already
              saved, so this only opens the share sheet with the message. */}
          {granted && (
            <button onClick={() => handleShare(granted)} className="btn-pill btn-secondary mt-2 w-full">
              <Share2 size={16} aria-hidden="true" /> Share invite
            </button>
          )}

          <p className={`${SHEET_HINT} mt-3`}>
            They'll see your shot, journal, and weight records once they sign in with this email. You can revoke access anytime.
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
                    onShare={handleShare}
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
                  <AccessEntry key={entry.id} entry={entry} />
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