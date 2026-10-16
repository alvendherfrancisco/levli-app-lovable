import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_TABS, MORE_ITEMS, ALL_NAV_ITEMS, MORE_PATHS, NavIcon } from "@/lib/nav";
import MoreSheet from "@/components/more/MoreSheet";
import { sound } from "@/lib/sounds";

/**
 * Phones (below 1024px): a five-item bottom tab bar — Home, Shots, Insights,
 * Journal, More — with History, Meds, Profile and Settings inside More,
 * which opens as a sheet resting on the bar rather than a page of its own.
 * Wider screens: the side rail, which lists every destination.
 *
 * Targets are at least 44pt tall with 8px between them, labels are always
 * visible at 11px, and the current page is marked by its icon filling in and its
 * label turning indigo. Nothing else marks it: no indicator line, and no box
 * behind a pressed or hovered tab. A tap still answers at once — the icon dips a
 * fraction and the whole tab steps back a little.
 */
export default function BottomTabBar() {
  const location = useLocation();
  const moreActive = MORE_PATHS.includes(location.pathname);
  // The More tab opens the sheet instead of a page, so it holds its own state.
  const [moreOpen, setMoreOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);

  // Measured as it opens, so the sheet meets the bar's own top edge — safe area
  // included — rather than a guess at its height.
  const openMore = () => {
    setBarHeight(barRef.current?.offsetHeight || 0);
    setMoreOpen(true);
  };

  // Leaving for another page closes it; a rotation re-measures the bar.
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const measure = () => setBarHeight(barRef.current?.offsetHeight || 0);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [moreOpen]);

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
                  active={isActive}
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
        ref={barRef}
        aria-label="Main"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe"
      >
        <ul className="flex items-stretch justify-around px-1 pt-1 gap-2">
          {PRIMARY_TABS.map((item) => {
            const isActive = item.path === "/more" ? moreActive : location.pathname === item.path;
            const isMore = item.path === "/more";
            const tabClass = `tab-item group flex flex-col items-center justify-center gap-1 py-1.5 min-h-[54px] transition-opacity hover:opacity-80 active:opacity-70 ${
              isActive
                ? "text-indigo-600 dark:text-[#8B8DF5]"
                : "text-gray-500 dark:text-[#9A9DAE]"
            }`;
            const tabContents = (
              <>
                {/* The icon filling in is what marks the current tab */}
                <span className="inline-flex transition-transform duration-150 ease-out group-active:scale-95">
                  <NavIcon item={item} size={24} active={isActive} strokeWidth={1.5} />
                </span>
                <span className={`text-[11px] leading-none truncate max-w-full ${isActive ? "font-medium" : "font-normal"}`}>
                  {item.label}
                </span>
              </>
            );
            return (
              <li key={item.path} className="flex-1 min-w-0">
                {isMore ? (
                  /* More opens the sheet above the bar; its icon and label are
                     the same tab it has always been. */
                  <button
                    type="button"
                    onClick={openMore}
                    aria-haspopup="dialog"
                    aria-expanded={moreOpen}
                    aria-current={isActive ? "page" : undefined}
                    className={`${tabClass} w-full`}
                  >
                    {tabContents}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => sound.tap()}
                    aria-current={isActive ? "page" : undefined}
                    className={tabClass}
                  >
                    {tabContents}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rides on the bar's own top edge, and closes on any of its destinations */}
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} bottom={barHeight} />
    </>
  );
}