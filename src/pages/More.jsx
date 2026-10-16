import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import { MORE_ITEMS, NavIcon } from "@/lib/nav";
import { useAppState } from "@/lib/AppState";

/** Everything that does not need its own tab lives here. */
export default function More() {
  // Shared records are a permanent entry here, so this screen — not the Home
  // shortcut, which can be put away — is always the way back to them. The count
  // says how many people are sharing; nothing is shown when nobody is.
  const { sharedWithMe } = useAppState();
  return (
    <PageContainer bottomInset="default">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">More</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <ul className="space-y-2">
          {MORE_ITEMS.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex items-center gap-3 min-h-[56px] px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 dark:bg-indigo-500/15">
                  <NavIcon item={item} size={20} className="text-indigo-600 dark:text-indigo-400" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-gray-900 dark:text-white">{item.label}</span>
                  <span className="block text-xs text-gray-500 dark:text-[#9A9DAE] truncate">{item.description}</span>
                </span>
                {item.path === "/shared-with-me" && sharedWithMe.length > 0 && (
                  <span className="flex h-[22px] min-w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                    {sharedWithMe.length}
                  </span>
                )}
                <ChevronRight size={18} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );
}