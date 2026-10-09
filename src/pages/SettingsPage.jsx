import React, { useState } from "react";
import {
  Moon, Bell, Volume2, FileText, MessageSquare, Database, Loader2, LogOut,
  Users, ShieldCheck, Trash2, FileDown, AlertTriangle, BookOpen, Share2,
} from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";
import { APP_VERSION, SUPPORT_EMAIL, DISCLAIMER_TEXT } from "@/lib/appInfo";
import { getSoundPreference, setSoundPreference, sound } from "@/lib/sounds";
import { buildFullExportCsv, downloadTextFile } from "@/lib/dataExport";
import { TRACKING_MODULES, trackingEnabled, chosenTrackingModules } from "@/lib/trackingModules";
import ScreenHeader from "@/components/ScreenHeader";
import SettingsRow from "@/components/SettingsRow";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/lib/toast";

// Where the placeholder Push Notifications switch keeps its position.
const NOTIF_PREF_KEY = "levli_push_notifications_enabled";

// Shared toggle — defined outside the component so React doesn't remount it
// on every state change (which caused the two toggles to look inconsistent).
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => { sound.tap(); onChange(!value); }}
      aria-pressed={value}
      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/** A section's small uppercase heading. */
function SectionHeading({ children }) {
  return <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">{children}</p>;
}

const CARD = "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800";
const CARD_ROWS = `${CARD} px-4 divide-y divide-gray-100 dark:divide-white/[0.07]`;

export default function SettingsPage() {
  const { darkMode, setDarkMode, profile, setProfile, shots, journalEntries, dayMetrics, adverseEvents, medications, inventory, repeatSchedules, proxyAccess, resetState } = useAppState();
  const { logout, user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Push Notifications is a placeholder for now: the switch remembers its
  // position on this device and nothing else happens when it moves. Push is
  // being rebuilt from scratch.
  const [notifEnabled, setNotifEnabled] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(NOTIF_PREF_KEY) === "true"
  );
  const [soundOn, setSoundOn] = useState(getSoundPreference());

  const handleDarkMode = async (val) => {
    await setDarkMode(val);
  };

  const handleSound = (val) => {
    setSoundPreference(val);
    setSoundOn(val);
    // Switching it on plays the chime once, so the choice is audible.
    if (val) sound.success();
  };

  // Placeholder only: the switch keeps its position on this device. Nothing is
  // requested, subscribed to, or sent.
  const handleNotifications = (val) => {
    setNotifEnabled(val);
    try { localStorage.setItem(NOTIF_PREF_KEY, val ? "true" : "false"); } catch { /* private mode */ }
  };

  // What Home and Insights show. A profile that has never answered the question
  // (an account from before it existed) starts from every module on, so
  // switching one off is what hides it; once the answer is stored it is the
  // only thing that decides.
  const handleTracking = (key, on) => {
    const current = chosenTrackingModules(profile) ?? TRACKING_MODULES.map((m) => m.key);
    const next = on ? [...new Set([...current, key])] : current.filter((k) => k !== key);
    setProfile({ ...profile, tracking_modules: next });
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

  const handleLogout = () => {
    resetState();
    logout();
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen w-full">
      <ScreenHeader title="Settings" />

      <div className="max-w-lg mx-auto pt-4">
        {/* 1. Appearance & Preferences */}
        <div className="px-4 mb-4">
          <SectionHeading>Appearance &amp; Preferences</SectionHeading>
          <div className={`${CARD} p-4 space-y-3`}>
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
              <Toggle value={notifEnabled} onChange={handleNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Volume2 size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" /></div>
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 block">Sound effects</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Soft tones when you tap, save something or get a warning.</span>
                </div>
              </div>
              <Toggle value={soundOn} onChange={handleSound} />
            </div>
          </div>
        </div>

        {/* What you're tracking — the same six modules onboarding offers. One
            that is off is simply not drawn on Home or in Insights; this is where
            it is added back. */}
        <div className="px-4 mb-4">
          <SectionHeading>What you're tracking</SectionHeading>
          <div className={`${CARD} p-4 space-y-3`}>
            {TRACKING_MODULES.map(({ key, label, Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Icon size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </div>
                <Toggle value={trackingEnabled(profile, key)} onChange={(on) => handleTracking(key, on)} />
              </div>
            ))}
          </div>
        </div>

        {/* 2. Your data */}
        <div className="px-4 mb-4">
          <SectionHeading>Your data</SectionHeading>
          <div className={CARD_ROWS}>
            <SettingsRow
              icon={<Share2 size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Share report with my doctor"
              hint="Doses, side effects and journal as a PDF"
              to="/report"
            />
            <SettingsRow
              icon={exportLoading ? <Loader2 size={ICON_SIZE_ROW} className="animate-spin text-gray-400" /> : <FileDown size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Export my data (CSV)"
              hint="Every log you have saved, in a spreadsheet"
              onPress={handleExportCsv}
            />
            <SettingsRow
              icon={<Database size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Backup &amp; restore"
              hint="Save a backup file, or restore one you saved earlier"
              to="/backup-restore"
            />
            <SettingsRow
              icon={<Trash2 size={ICON_SIZE_ROW} className="text-red-500" />}
              label="Delete my account and all data"
              hint="Permanent. Removes everything, including your account"
              onPress={() => { setDeleteEmail(""); setDeleteOpen(true); }}
              danger
            />
          </div>
        </div>

        {/* 3. Caregiver access */}
        <div className="px-4 mb-4">
          <SectionHeading>Caregiver Access</SectionHeading>
          <div className={CARD_ROWS}>
            <SettingsRow
              icon={<Users size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Manage access"
              hint="Grant scoped, revocable access to someone you trust"
              to="/caregiver-access"
            />
          </div>
        </div>

        {/* 4. Legal & safety */}
        <div className="px-4 mb-4">
          <SectionHeading>Legal &amp; safety</SectionHeading>
          <div className={CARD_ROWS}>
            <SettingsRow icon={<ShieldCheck size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Privacy Policy" to="/privacy" />
            <SettingsRow icon={<FileText size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Terms of Use" to="/terms" />
            <SettingsRow icon={<AlertTriangle size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="Medical disclaimer" to="/medical-disclaimer" />
            <SettingsRow icon={<BookOpen size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />} label="About &amp; sources" hint="The official labels Levli is based on" to="/about-sources" />
          </div>
        </div>

        {/* 5. Support */}
        <div className="px-4 mb-4">
          <SectionHeading>Support</SectionHeading>
          <div className={CARD_ROWS}>
            <SettingsRow
              icon={<MessageSquare size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Help &amp; feedback"
              hint={SUPPORT_EMAIL}
              to="/help-feedback"
            />
          </div>
        </div>

        {/* 6. Log out */}
        <div className="px-4 mb-4">
          <button
            onClick={handleLogout}
            className={`w-full min-h-[48px] flex items-center justify-center gap-2 py-3.5 ${CARD} text-red-600 dark:text-red-400 font-semibold`}
          >
            <LogOut size={ICON_SIZE_ROW} aria-hidden="true" /> Log Out
          </button>
        </div>

        <div className="px-5 pb-6 text-center pb-safe space-y-2">
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE] leading-relaxed max-w-md mx-auto">{DISCLAIMER_TEXT}</p>
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">Levli v{APP_VERSION} · {SUPPORT_EMAIL}</p>
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">© 2026 Levli</p>
        </div>
      </div>

      {/* Account deletion — server-side, with a typed confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message="This permanently deletes your account and every record in it — doses, side effects, weight, nutrition, journal entries, photos, inventory. It cannot be undone. Export your data first if you want a copy."
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