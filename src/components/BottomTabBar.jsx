import React from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_TABS, ALL_NAV_ITEMS, MORE_PATHS, NavIcon } from "@/lib/nav";
import { sound } from "@/lib/sounds";

/**
 * Phones (below 1024px): a five-item bottom tab bar — Home, Shots, Insights,
 * Journal, More — with History, Meds, Stock, Profile and Settings inside More.
 * Wider screens: the side rail, which lists every destination.
 *
 * Targets are at least 44pt tall with 8px between them, labels are always
 * visible at 12px, and the current page is marked by a filled icon, a bolder
 * label and a top indicator — never by colour alone.
 */
export default function BottomTabBar() {
  const location = useLocation();
  const moreActive = MORE_PATHS.includes(location.pathname);

  return (
    <>
      {/* Desktop and tablet: left side rail, shown from 1024px up */}
      <nav
        aria-label="Main"
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40 pt-8 pb-6 px-4"
      >
        <div className="mb-8 px-2">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Levli</span>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {ALL_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => sound.tap()}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl transition-all font-medium text-base ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-gray-600 dark:text-[#9A9DAE] hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-[#E8E9F0]"
                }`}
              >
                <NavIcon
                  item={item}
                  size={20}
                  className={isActive ? "text-indigo-600 dark:text-indigo-400" : ""}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Phones: bottom tab bar */}
      <nav
        aria-label="Main"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe"
      >
        <ul className="flex items-stretch justify-around px-1 pt-1 gap-2">
          {PRIMARY_TABS.map((item) => {
            const isActive = item.path === "/more" ? moreActive : location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1 min-w-0">
                <Link
                  to={item.path}
                  onClick={() => sound.tap()}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 min-h-[52px] rounded-xl transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-[#9A9DAE]"
                  }`}
                >
                  {/* Shape, not colour alone, marks the current tab */}
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 h-0.5 w-6 rounded-full ${isActive ? "bg-indigo-600 dark:bg-indigo-400" : "bg-transparent"}`}
                  />
                  <NavIcon item={item} size={24} />
                  <span className={`text-xs leading-none truncate max-w-full ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}