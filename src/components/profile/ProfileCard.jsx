import React from "react";
import SavedFlag from "@/components/profile/SavedFlag";

/**
 * One card on the Profile screen: the app's card — the same hairline, the same
 * 16px radius and the same margins as everywhere else in the app — with a heading
 * row of an icon tile, the card's title, and the small "Saved" the fields inside
 * write. Each card is given its own icon, so the screen tells its three subjects
 * apart at a glance: the person, their body, their prescriber.
 */
export default function ProfileCard({ icon: Icon, title, saved = false, children }) {
  return (
    <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
          <Icon size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg flex-1">{title}</h3>
        <SavedFlag show={saved} />
      </div>
      {children}
    </div>
  );
}