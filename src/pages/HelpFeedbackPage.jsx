import React from "react";
import { Mail, MessageSquare, ExternalLink } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import SettingsRow from "@/components/SettingsRow";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";
import { SUPPORT_EMAIL, FEEDBACK_EMAIL } from "@/lib/appInfo";

/** Help and feedback — how to reach a human, and where to send thoughts. */
export default function HelpFeedbackPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen w-full">
      <ScreenHeader title="Help &amp; feedback" subtitle={SUPPORT_EMAIL} />

      <div className="max-w-lg mx-auto pt-4">
        <div className="px-4 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-white/[0.07]">
            <SettingsRow
              icon={<Mail size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Contact support"
              hint={SUPPORT_EMAIL}
              href={`mailto:${SUPPORT_EMAIL}?subject=Levli%20support`}
            />
            <SettingsRow
              icon={<MessageSquare size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
              label="Leave feedback"
              hint={FEEDBACK_EMAIL}
              href={`mailto:${FEEDBACK_EMAIL}?subject=Levli%20feedback`}
            />
          </div>
        </div>

        <div className="px-4 mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-[#9A9DAE] px-1">
          <ExternalLink size={14} aria-hidden="true" />
          <span>Both open your own mail app, so nothing is sent until you press send.</span>
        </div>
      </div>
    </div>
  );
}