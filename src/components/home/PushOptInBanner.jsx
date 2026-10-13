import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import usePushPermission from "@/hooks/usePushPermission";
import { isRunningInIOSWrapper } from "@/lib/iosBridge";
import { isPushOn, optInPolicy, turnOnPush } from "@/lib/pushPermission";

// Home's push ask: an opt-in while the OS has not been asked, and a one-shot
// tip pointing to Settings once it was denied. Silent when push is on.
export default function PushOptInBanner() {
  const { status, resolved } = usePushPermission();
  const [hidden, setHidden] = useState(false);
  if (!isRunningInIOSWrapper() || !resolved || hidden || isPushOn(status)) return null;

  const denied = status === "denied";
  if (denied ? !optInPolicy.canShowDeniedTip() : !optInPolicy.canShowBanner()) return null;

  const close = () => {
    denied ? optInPolicy.markDeniedTipShown() : optInPolicy.dismissBanner();
    setHidden(true);
  };
  const act = () => { turnOnPush(); if (denied) optInPolicy.markDeniedTipShown(); setHidden(true); };

  return (
    <div className="card-line rounded-2xl bg-white dark:bg-gray-900 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
        <Bell size={18} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {denied ? "Notifications are off" : "Never miss a shot"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {denied ? "Turn them on in Settings to get your shot-day reminder." : "Get a gentle reminder on the morning of your scheduled shot."}
        </p>
        <button onClick={act} className="btn-link text-sm mt-2">{denied ? "Open Settings" : "Turn on reminders"}</button>
      </div>
      <button onClick={close} aria-label="Dismiss"><X size={18} className="text-gray-400" /></button>
    </div>
  );
}