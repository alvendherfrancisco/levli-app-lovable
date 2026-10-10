import React, { useState } from "react";
import { ChevronDown, UserPlus, X } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useAppState } from "@/lib/AppState";
import { sound } from "@/lib/sounds";
import { toast } from "@/lib/toast";

/** How a stored scope and status read on screen. */
const SCOPE_LABEL = { read: "Read only", read_write: "Read & write" };
const STATUS_LABEL = { pending: "Invited — waiting for them to register", active: "Active" };

/**
 * Caregiver access — who can see this account's logs, and with what scope.
 * Granting, revoking and the record of past access all live here.
 */
export default function CaregiverAccessPage() {
  const { proxyAccess, addProxyAccess, revokeProxyAccess } = useAppState();
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("read");
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const withAccess = proxyAccess.filter((p) => p.status !== "revoked");
  const past = proxyAccess.filter((p) => p.status === "revoked");

  const handleGrant = async () => {
    if (!email.trim()) { toast.error("Enter an email address"); return; }
    setSaving(true);
    try {
      await addProxyAccess({
        grantee_email: email.trim(),
        scope,
        status: "pending",
        granted_date: new Date().toISOString(),
      });
      setEmail("");
      toast.success("Access granted. The recipient can view your data once they register with this email.");
    } catch (err) {
      toast.error("Failed to grant access");
    }
    setSaving(false);
  };

  const handleRevoke = async (id) => {
    sound.delete();
    await revokeProxyAccess(id);
    toast.deleted("Access revoked");
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen w-full">
      <ScreenHeader title="Caregiver access" />

      <div className="max-w-lg mx-auto pt-4">
        {/* Grant access */}
        <div className="px-4 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Grant scoped, revocable access to a caregiver or family member so they can view your logs.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="caregiver@email.com"
                className="flex-1 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300 min-w-0" />
              <select value={scope} onChange={(e) => setScope(e.target.value)}
                aria-label="Permission"
                className="border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-3 py-2 text-sm outline-none sm:w-auto">
                <option value="read">Read only</option>
                <option value="read_write">Read & write</option>
              </select>
            </div>
            <button onClick={handleGrant} disabled={saving}
              className="btn-pill btn-primary w-full">
              <UserPlus size={16} /> {saving ? "Granting…" : "Grant Access"}
            </button>
          </div>
        </div>

        {/* People with access */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">People with access</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            {withAccess.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-[#9A9DAE]">No one else can see your logs.</p>
            ) : (
              <div className="space-y-3">
                {withAccess.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm gap-2">
                    <div className="min-w-0">
                      <span className="text-gray-700 dark:text-gray-300 truncate block">{p.grantee_email}</span>
                      <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">
                        {SCOPE_LABEL[p.scope] || p.scope} · {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </div>
                    <button onClick={() => handleRevoke(p.id)} aria-label={`Revoke access for ${p.grantee_email}`}
                      className="text-red-600 dark:text-red-400 flex items-center gap-1 text-xs min-h-[44px] px-2 flex-shrink-0">
                      <X size={14} aria-hidden="true" /> Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Past access — collapsed until it is asked for */}
        {past.length > 0 && (
          <div className="px-4 mb-4">
            <button onClick={() => setShowPast((v) => !v)} aria-expanded={showPast}
              className="w-full flex items-center justify-between gap-2 min-h-[44px] px-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Past access ({past.length})
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showPast ? "rotate-180" : ""}`} />
            </button>
            {showPast && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                {past.map((p) => (
                  <div key={p.id} className="text-sm">
                    <span className="text-gray-500 dark:text-[#9A9DAE] truncate block">{p.grantee_email}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {SCOPE_LABEL[p.scope] || p.scope} · Revoked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}