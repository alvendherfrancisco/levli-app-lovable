import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Moon, Lock, Mail, Bell, Database, FileText, MessageSquare, ChevronRight, Download, Upload, Loader2, LogOut, UserPlus, X, Share, ShieldCheck, Trash2, FileDown, AlertTriangle, BookOpen, Info, Vibrate } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/pushSubscription";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";
import { APP_VERSION, SUPPORT_EMAIL, FEEDBACK_EMAIL, DISCLAIMER_TEXT } from "@/lib/appInfo";
import { getHapticsPreference, setHapticsPreference, haptic } from "@/lib/haptics";
import { buildFullExportCsv, downloadTextFile } from "@/lib/dataExport";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/lib/toast";

// Shared toggle — defined outside the component so React doesn't remount it
// on every state change (which caused the two toggles to look inconsistent).
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => { haptic("medium"); onChange(!value); }}
      aria-pressed={value}
      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, profile, setProfile, shots, journalEntries, dayMetrics, adverseEvents, medications, inventory, repeatSchedules, proxyAccess, addProxyAccess, revokeProxyAccess, resetState } = useAppState();
  const { logout, user } = useAuth();
  const isDeveloper = user?.email === "alvendherfrancisco01@gmail.com";
  const [proxyEmail, setProxyEmail] = useState("");
  const [proxyScope, setProxyScope] = useState("read");
  const [proxySaving, setProxySaving] = useState(false);

  const handleGrantProxy = async () => {
    if (!proxyEmail.trim()) { toast.error("Enter an email address"); return; }
    setProxySaving(true);
    try {
      await addProxyAccess({
        grantee_email: proxyEmail.trim(),
        scope: proxyScope,
        status: "pending",
        granted_date: new Date().toISOString(),
      });
      setProxyEmail("");
      toast.success("Access granted. The recipient can view your data once they register with this email.");
    } catch (err) {
      toast.error("Failed to grant access");
    }
    setProxySaving(false);
  };

  const handleRevoke = async (id) => {
    haptic("warning");
    await revokeProxyAccess(id);
    toast.deleted("Access revoked");
  };

  const handleLogout = () => {
    resetState();
    logout();
  };
  const [notifEnabled, setNotifEnabled] = useState(profile?.notifications_enabled || false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // iOS home-screen detection (push only works when installed on iOS)
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = typeof window !== "undefined" &&
    (window.navigator?.standalone || window.matchMedia?.("(display-mode: standalone)")?.matches);
  const [iosBannerDismissed, setIosBannerDismissed] = useState(
    typeof localStorage !== "undefined" && localStorage.getItem("levli_ios_banner_dismissed") === "true"
  );
  const showIOSBanner = isIOS && !isStandalone && !iosBannerDismissed && notifEnabled;
  const dismissIOSBanner = () => {
    setIosBannerDismissed(true);
    localStorage.setItem("levli_ios_banner_dismissed", "true");
  };

  const MenuItem = ({ icon, label, hint, onPress, href, to, danger }) => {
    const inner = (
      <div className="flex items-center justify-between py-3.5 w-full min-h-[44px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</div>
          <span className={`text-sm ${danger ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
            {label}
            {hint && <span className="block text-xs text-gray-500 dark:text-[#9A9DAE]">{hint}</span>}
          </span>
        </div>
        <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
      </div>
    );
    if (to) return <Link to={to}>{inner}</Link>;
    if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
    if (onPress) return <button onClick={onPress} className="w-full text-left">{inner}</button>;
    return inner;
  };

  const handleDarkMode = async (val) => {
    await setDarkMode(val);
  };

  const [hapticsOn, setHapticsOn] = useState(getHapticsPreference());
  const handleHaptics = (val) => {
    setHapticsPreference(val);
    setHapticsOn(val);
  };

  const handleNotifications = async (val) => {
    if (notifLoading) return;
    if (val) {
      // Turning ON: subscribe to push, send confirmation if new
      setNotifLoading(true);
      try {
        const { subObj, isNew } = await subscribeToPush();
        setNotifEnabled(true);
        await setProfile({ ...profile, notifications_enabled: true });
        if (isNew) {
          try {
            await base44.functions.invoke("send-confirmation-push", { subscription: subObj });
          } catch (e) {
            console.error("Confirmation push failed:", e);
          }
        }
      } catch (e) {
        setNotifEnabled(false);
        toast.error(`Could not enable notifications: ${e.message}`);
      } finally {
        setNotifLoading(false);
      }
    } else {
      // Turning OFF: silently unsubscribe, no notification
      setNotifEnabled(false);
      await setProfile({ ...profile, notifications_enabled: false });
      try { await unsubscribeFromPush(); } catch (e) { console.error("Unsubscribe failed:", e); }
    }
  };

  const handleNotifToggle = async (field, value) => {
    await setProfile({ ...profile, [field]: value });
  };

  // Every record the account holds, in one CSV. The PDF report (doses, side
  // effects and journal) is produced by the report screen.
  const handleExportCsv = () => {
    setExportLoading(true);
    const csv = buildFullExportCsv({
      profile, shots, dayMetrics, journalEntries, adverseEvents,
      medications, inventory, repeatSchedules, proxyAccess,
      email: user?.email,
    });
    downloadTextFile(`levli-data-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setExportLoading(false);
    toast.success("Your data export has been downloaded");
  };

  const handleBackup = () => {
    setBackupLoading(true);
    const data = { shots, journalEntries, dayMetrics, profile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `levli-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    setBackupLoading(false);
  };

  const handleRestore = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      setRestoreLoading(true);
      const file = e.target.files[0];
      if (!file) { setRestoreLoading(false); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.profile) await setProfile({ ...profile, ...data.profile });
        // Restore shots
        if (data.shots && Array.isArray(data.shots) && data.shots.length) {
          await base44.entities.Shot.bulkCreate(data.shots.map((s) => ({
            medication: s.medication, dose: s.dose, drug_class: s.drug_class, molecular_class: s.molecular_class,
            route: s.route, device_type: s.device_type, dose_unit: s.dose_unit, medication_id: s.medication_id,
            concentration: s.concentration,
            date: s.date, time: s.time, site: s.site, pain: s.pain, notes: s.notes,
            reconstitution_date: s.reconstitution_date, in_use_expiry: s.in_use_expiry,
          })));
        }
        // Restore journal entries
        if (data.journalEntries && Array.isArray(data.journalEntries) && data.journalEntries.length) {
          await base44.entities.JournalEntry.bulkCreate(data.journalEntries.map((j) => ({
            text: j.text, date: j.date, time: j.time, mood: j.mood, mood_color: j.mood_color, category: j.category,
          })));
        }
        toast.success("Restore complete. Please reload the app to see your restored data.");
      } catch (err) {
        toast.error("Restore failed: " + (err.message || "invalid file"));
      }
      setRestoreLoading(false);
    };
    input.click();
  };

  // Deletes the account and every record it holds, server-side, then signs out.
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await base44.functions.invoke("delete-account", { confirmEmail: deleteEmail });
      if (res.data?.ok) {
        setDeleteOpen(false);
        toast.success("Your account and all of its data have been deleted.");
        resetState();
        setTimeout(() => logout(), 1200);
      } else {
        toast.error(res.data?.error || "Could not delete your account. Please contact support.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not delete your account. Please contact support.");
    }
    setDeleteLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen w-full">
      {/* Full-width header */}
      <div className="w-full flex items-center gap-3 px-5 pt-6 pb-4 bg-white dark:bg-gray-950 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} aria-label="Go back"><ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="max-w-lg mx-auto pt-4">
        {/* Settings toggles */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Appearance &amp; Security</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Moon size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" /></div>
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Dark Mode</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Follows your device until you choose here.</span>
                </div>
              </div>
              <Toggle value={darkMode} onChange={handleDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Bell size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" /></div>
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Push Notifications</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Get a gentle reminder on the morning of your scheduled shot.</span>
                </div>
              </div>
              {notifLoading ? (
                <Loader2 size={20} className="animate-spin text-indigo-500 flex-shrink-0" />
              ) : (
                <Toggle value={notifEnabled} onChange={handleNotifications} />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Vibrate size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" /></div>
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Haptic feedback</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">A light tap when you log a dose, save or get a reminder error.</span>
                </div>
              </div>
              <Toggle value={hapticsOn} onChange={handleHaptics} />
            </div>
          </div>
        </div>

        {/* iOS Add to Home Screen banner */}
        {showIOSBanner && (
          <div className="px-4 mb-4">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Share size={ICON_SIZE_ROW} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Add Levli to your Home Screen</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">
                    Push reminders only work on iPhone when Levli is installed to your home screen. Tap the Share button in Safari, then "Add to Home Screen".
                  </p>
                  <button onClick={dismissIOSBanner} className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-2 underline">
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual notification toggles — only visible when push is enabled */}
        {notifEnabled && (
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Notifications</p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Shot Reminders</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Reminds you on the day of your scheduled dose.</span>
                </div>
                <Toggle value={profile?.notif_shot_reminders !== false} onChange={(v) => handleNotifToggle('notif_shot_reminders', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Symptom &amp; Mood Check-ins</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">A gentle nudge to log how you're feeling, a few times a week.</span>
                </div>
                <Toggle value={!!profile?.notif_checkin_reminders} onChange={(v) => handleNotifToggle('notif_checkin_reminders', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Weight Logging</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Weekly reminder to log your weight.</span>
                </div>
                <Toggle value={!!profile?.notif_weight_reminders} onChange={(v) => handleNotifToggle('notif_weight_reminders', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Medication Inventory Alerts</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Notifies you when you're running low on doses.</span>
                </div>
                <Toggle value={profile?.notif_inventory_alerts !== false} onChange={(v) => handleNotifToggle('notif_inventory_alerts', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Re-engagement Nudges</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">A supportive check-in if you haven't opened the app in a few days.</span>
                </div>
                <Toggle value={!!profile?.notif_reengagement} onChange={(v) => handleNotifToggle('notif_reengagement', v)} />
              </div>
            </div>
          </div>
        )}

        {/* Your data */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Your data</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-white/[0.07]">
            <MenuItem
              icon={exportLoading ? <Loader2 size={ICON_SIZE_ROW} className="animate-spin text-gray-400" /> : <FileDown size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Export my data (CSV)"
              hint="Every log you have saved, in a spreadsheet"
              onPress={handleExportCsv}
            />
            <MenuItem icon={<FileText size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Export health report (PDF)" hint="Doses, side effects and journal for your clinician" to="/report" />
            <MenuItem icon={backupLoading ? <Loader2 size={ICON_SIZE_ROW} className="animate-spin text-gray-400" /> : <Download size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Backup data" hint="A file you can restore later" onPress={handleBackup} />
            <MenuItem icon={restoreLoading ? <Loader2 size={ICON_SIZE_ROW} className="animate-spin text-gray-400" /> : <Upload size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Restore data" onPress={handleRestore} />
            <MenuItem
              icon={<Trash2 size={ICON_SIZE_ROW} className="text-red-500" />}
              label="Delete my account and all data"
              hint="Permanent. Removes everything, including your account"
              onPress={() => { setDeleteEmail(""); setDeleteOpen(true); }}
              danger
            />
          </div>
        </div>

        {/* Legal & safety */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Legal &amp; safety</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-white/[0.07]">
            <MenuItem icon={<ShieldCheck size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Privacy Policy" to="/privacy" />
            <MenuItem icon={<FileText size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Terms of Use" to="/terms" />
            <MenuItem icon={<AlertTriangle size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Medical disclaimer" to="/medical-disclaimer" />
            <MenuItem icon={<BookOpen size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="About &amp; sources" hint="The official labels Levli is based on" to="/about-sources" />
            <MenuItem
              icon={<AlertTriangle size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Report an error in medical info"
              href={`mailto:${SUPPORT_EMAIL}?subject=Medical%20information%20error%20in%20Levli`}
            />
          </div>
        </div>

        {/* Proxy / Caregiver Access */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Caregiver Access</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Grant scoped, revocable access to a caregiver or family member so they can view your logs.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="email" value={proxyEmail} onChange={(e) => setProxyEmail(e.target.value)} placeholder="caregiver@email.com"
                className="flex-1 border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300 min-w-0" />
              <select value={proxyScope} onChange={(e) => setProxyScope(e.target.value)}
                className="border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-3 py-2 text-sm outline-none sm:w-auto">
                <option value="read">Read only</option>
                <option value="read_write">Read & write</option>
              </select>
            </div>
            <button onClick={handleGrantProxy} disabled={proxySaving}
              className="w-full min-h-[44px] py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <UserPlus size={16} /> {proxySaving ? "Granting…" : "Grant Access"}
            </button>
            {proxyAccess.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/[0.08]">
                {proxyAccess.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm gap-2">
                    <div className="min-w-0">
                      <span className="text-gray-700 dark:text-gray-300 truncate block">{p.grantee_email}</span>
                      <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{p.scope} · {p.status}</span>
                    </div>
                    {p.status !== "revoked" && (
                      <button onClick={() => handleRevoke(p.id)} className="text-red-600 dark:text-red-400 flex items-center gap-1 text-xs min-h-[44px] px-2">
                        <X size={14} aria-hidden="true" /> Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Support</p>
          <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-white/[0.07]">
            <MenuItem icon={<Mail size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Contact support" hint={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}`} />
            <MenuItem icon={<MessageSquare size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Leave feedback" href={`mailto:${FEEDBACK_EMAIL}`} />
            {isDeveloper && <MenuItem icon={<Bell size={ICON_SIZE_ROW} className="text-indigo-500" />} label="Push Notification Test" to="/push-test" />}
          </div>
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={handleLogout}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 font-semibold rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <LogOut size={ICON_SIZE_ROW} aria-hidden="true" /> Log Out
          </button>
        </div>

        <div className="px-5 pb-6 text-center pb-safe space-y-2">
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE] leading-relaxed max-w-md mx-auto">{DISCLAIMER_TEXT}</p>
          <div className="flex items-center justify-center gap-3 text-xs">
            <Link to="/medical-disclaimer" className="text-indigo-600 dark:text-indigo-400 underline">Medical disclaimer</Link>
            <Link to="/about-sources" className="text-indigo-600 dark:text-indigo-400 underline">About &amp; sources</Link>
            <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 underline">Privacy</Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">Levli v{APP_VERSION} · {SUPPORT_EMAIL}</p>
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">© 2026 Levli</p>
        </div>
      </div>

      {/* Account deletion — server-side, with a typed confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message="This permanently deletes your account and every record in it — doses, side effects, weight, nutrition, journal entries, photos, inventory, reminders. It cannot be undone. Export your data first if you want a copy."
        confirmLabel={deleteLoading ? "Deleting…" : "Delete everything"}
        cancelLabel="Keep my account"
        destructive
        busy={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
      >
        <label className="block mt-4">
          <span className="text-sm text-gray-600 dark:text-[#9A9DAE]">Type your account email to confirm</span>
          <input
            type="email"
            value={deleteEmail}
            onChange={(e) => setDeleteEmail(e.target.value)}
            autoComplete="email"
            className="mt-2 w-full border border-gray-200 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] rounded-xl px-3 py-3 text-base outline-none focus:border-indigo-300"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}