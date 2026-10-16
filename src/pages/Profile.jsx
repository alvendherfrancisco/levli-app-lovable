import React from "react";
import { Link } from "react-router-dom";
import { Settings, Share2, Users } from "lucide-react";
import { HEADER_ICON, HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import { ICON_SIZE_ROW } from "@/lib/iconConstants";
import PageContainer from "@/components/PageContainer";
import SettingsRow from "@/components/SettingsRow";
import DetailsCard from "@/components/profile/DetailsCard";
import BodyGoalCard from "@/components/profile/BodyGoalCard";
import PrescriberCard from "@/components/profile/PrescriberCard";

/**
 * Profile: who the person is and who cares for them — their name and date of
 * birth, their body and goal, their prescriber, and the two things that
 * information is for (the report they share with their doctor, and the access
 * someone they trust has been given).
 *
 * Everything that only concerns the app itself — how it looks, how it behaves,
 * what it does with the data, and who to ask for help — lives in Settings, which
 * the gear in this header keeps one tap away. Nothing is on both screens.
 *
 * Every field saves itself. There is no Save button to remember: the value is
 * written when the field is left (or Done is tapped on the keyboard) and a small
 * "Saved" beside that card's heading says it landed. A value that cannot be right
 * is refused with a short line under the field rather than written.
 */
export default function Profile() {
  return (
    <PageContainer bottomInset="default" className="bg-white dark:bg-gray-950" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
          <Settings size={HEADER_GLYPH} aria-hidden="true" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        <DetailsCard />
        <BodyGoalCard />
        <PrescriberCard />

        {/* The two things this screen's information is for, under the person they
            belong to. They used to sit in Settings; they are about the person, so
            they live here, next to the prescriber they are used with. */}
        <div className="mx-4 mb-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-4 divide-y divide-gray-100 dark:divide-white/[0.07]">
          <SettingsRow
            icon={<Share2 size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
            label="Share report with my doctor"
            hint="Doses, side effects and journal as a PDF"
            to="/report"
          />
          <SettingsRow
            icon={<Users size={ICON_SIZE_ROW} className="text-gray-500 dark:text-gray-400" />}
            label="Manage access"
            hint="Grant scoped, revocable access to someone you trust"
            to="/caregiver-access"
          />
        </div>
      </div>
    </PageContainer>
  );
}