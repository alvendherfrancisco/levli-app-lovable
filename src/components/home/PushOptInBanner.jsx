import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import CardTitleRow from "@/components/home/CardTitleRow";
import { CARD } from "@/lib/cardStyles";
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
    <div className={`${CARD} p-4`}>
      <CardTitleRow
        icon={<Bell size={16} className="text-indigo-600 dark:text-indigo-400" />}
        label={denied ? "Notifications are off" : "Never miss a shot"}
        trailing={
          <button
            type="button"
            onClick={close}
            aria-label="Dismiss"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-gray-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        }
      />
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {denied ? "Turn them on in Settings to get your shot-day reminder." : "Get a gentle reminder on the morning of your scheduled shot."}
      </p>
      <button onClick={act} className="btn-link text-sm mt-3">{denied ? "Open Settings" : "Turn on reminders"}</button>
    </div>
  );
}