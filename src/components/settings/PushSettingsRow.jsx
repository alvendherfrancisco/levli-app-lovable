import React from "react";
import { Bell } from "lucide-react";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";
import usePushPermission from "@/hooks/usePushPermission";
import { isPushOn, turnOnPush } from "@/lib/pushPermission";

// Push status as iOS reports it, with the one action that can change it.
export default function PushSettingsRow() {
  const { status, resolved } = usePushPermission();
  const on = isPushOn(status);
  const action = !resolved ? "Checking…" : on ? "On" : status === "denied" ? "Open Settings" : "Turn on";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><Bell size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" /></div>
        <div>
          <span className="text-sm text-gray-700 dark:text-gray-300 block">Push notifications</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {status === "denied" ? "Turned off in your iPhone settings." : "Get a gentle reminder on the morning of your scheduled shot."}
          </span>
        </div>
      </div>
      {resolved && !on ? (
        <button onClick={turnOnPush} className="btn-link text-sm whitespace-nowrap">{action}</button>
      ) : (
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{action}</span>
      )}
    </div>
  );
}