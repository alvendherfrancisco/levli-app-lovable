import React, { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import AccessEntry from "@/components/caregiver/AccessEntry";
import GrantAccessForm from "@/components/caregiver/GrantAccessForm";
import PastAccessSection from "@/components/caregiver/PastAccessSection";
import { CARD_DIVIDED, SECTION_LABEL } from "@/lib/cardStyles";
import { useAppState } from "@/lib/AppState";
import { accessStatus, inviteCaregiver, isEmail, shareInvite } from "@/lib/caregiverShare";
import { toast } from "@/lib/toast";

/**
 * Caregiver access — who can see this account's logs, and with what level.
 *
 * Granting saves the invite as pending and names the address it was granted to.
 * Nothing leaves the app by itself: the person who granted it shares the invite
 * from the success state, or from any entry that is still waiting, and the invite
 * becomes active the first time that exact address signs in. Revoking asks first
 * and takes effect at once, on the server.
 */
export default function CaregiverAccessPage() {
  const { proxyAccess, loadProxyAccess, revokeProxyAccess } = useAppState();
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("read");
  const [saving, setSaving] = useState(false);
  // The address just granted, so its own Share invite button can sit in the
  // success state without anyone having to type it in again.
  const [granted, setGranted] = useState("");
  const [revoking, setRevoking] = useState(null);

  const people = proxyAccess.filter((row) => ["pending", "active"].includes(accessStatus(row)));
  const past = proxyAccess.filter((row) => ["revoked", "expired"].includes(accessStatus(row)));
  // The level is only worth repeating on a row while more than one of them is in
  // play; with a single level it would be the same word on every entry.
  const showScope = new Set(proxyAccess.map((row) => row.scope || "read")).size > 1;

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

  // The dialog asks the question and does its own countdown of the red button, so
  // nothing is repeated here: by the time this runs, revoking is what was asked for.
  const confirmRevoke = async () => {
    const entry = revoking;
    setRevoking(null);
    if (!entry) return;
    try {
      await revokeProxyAccess(entry.id);
      toast.deleted("Access revoked");
    } catch {
      toast.error("That could not be revoked. Try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950">
      <ScreenHeader title="Caregiver access" subtitle="Share your records with someone you trust." />

      <div className="mx-auto max-w-lg pt-2 pb-16">
        {/* Grant access */}
        <section className="mb-5 px-4">
          <p className={`mb-2 ${SECTION_LABEL}`}>Grant access</p>
          <GrantAccessForm
            email={email}
            onEmail={setEmail}
            scope={scope}
            onScope={setScope}
            saving={saving}
            granted={granted}
            onGrant={handleGrant}
            onShare={handleShare}
          />
        </section>

        {/* People with access */}
        <section className="mb-5 px-4">
          <p className={`mb-2 ${SECTION_LABEL}`}>People with access</p>
          <div className={`${CARD_DIVIDED} px-4`}>
            {people.length === 0 ? (
              <p className="py-4 text-sm text-gray-500 dark:text-[#9A9DAE]">No one has access yet.</p>
            ) : (
              people.map((entry) => (
                <AccessEntry
                  key={entry.id}
                  entry={entry}
                  showScope={showScope}
                  onShare={handleShare}
                  onRevoke={setRevoking}
                />
              ))
            )}
          </div>
        </section>

        {/* Access that has ended, folded away until it is asked for. */}
        <PastAccessSection entries={past} />
      </div>

      <ConfirmDialog
        open={!!revoking}
        showIcon={false}
        tone="destructive"
        title={revoking ? `Revoke access for ${revoking.grantee_email}?` : "Revoke access?"}
        message="They will no longer see your records."
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        onConfirm={confirmRevoke}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}