import React, { useLayoutEffect, useRef } from "react";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import { sound } from "@/lib/sounds";

/**
 * The day strip on Home: today in the middle, seven days either side of it and
 * nothing beyond that range — a week back and a week ahead, fifteen days in all.
 *
 * It scrolls sideways rather than squeezing fifteen days onto the screen, and it
 * opens already centred on today, so the day in hand sits in the middle of the
 * strip with the week behind it to the left and the week ahead to the right.
 *
 * The chips themselves are unchanged: the same size, the same teal dot on a day
 * with something logged, and the same indigo highlight on the day in hand — a
 * soft tile with gently rounded corners, the one shape in the app that is not a
 * pill (see .date-chip in src/index.css). Each day is a ~96px wide, ~114px tall
 * tile, so the weekday, the date and the month sit inside it with equal room
 * above and below, and the dot is pinned to the tile's foot so a day with
 * something logged never shifts its own labels.
 */
const DAYS_EACH_SIDE = 7;

export default function DateStrip({ selectedDate, onSelectDate }) {
  const { shots } = useAppState();
  const today = new Date();
  const selected = selectedDate || today;
  const todayKey = toDayKey(today);

  const stripRef = useRef(null);
  const todayRef = useRef(null);

  // Centre today before the first paint, so the strip is never seen sitting at
  // its left edge for a frame. Smooth scrolling is switched off for this one
  // move, because the page sets scroll-behavior globally and would animate it.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const chip = todayRef.current;
    if (!strip || !chip) return;
    const stripRect = strip.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const target = strip.scrollLeft + (chipRect.left - stripRect.left) - (stripRect.width - chipRect.width) / 2;
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft = target;
    strip.style.scrollBehavior = "";
  }, []);

  const shotDayKeys = new Set(shots.map((s) => {
    const d = parseShotDate(s.date);
    return d ? toDayKey(d) : null;
  }).filter(Boolean));

  const days = [];
  for (let i = -DAYS_EACH_SIDE; i <= DAYS_EACH_SIDE; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    // 24px below the strip, so the selected day's tile and its glow sit clear of
    // the card that follows instead of crowding it.
    <div ref={stripRef} className="overflow-x-auto no-scrollbar pt-3 pb-6">
      <div className="flex items-center gap-1.5 sm:gap-3 px-3 w-max mx-auto">
        {days.map((d) => {
          const isSelected = d.getDate() === selected.getDate() && d.getMonth() === selected.getMonth() && d.getFullYear() === selected.getFullYear();
          const isToday = toDayKey(d) === todayKey;
          const hasShot = shotDayKeys.has(toDayKey(d));
          return (
            <button
              key={d.getTime()}
              ref={isToday ? todayRef : null}
              onClick={() => { sound.tap(); onSelectDate && onSelectDate(d); }}
              className={`date-chip relative flex flex-col items-center justify-center gap-0.5 w-24 h-[114px] flex-shrink-0 transition-all ${
                isSelected
                  ? "bg-indigo-600 dark:bg-indigo-500/80 text-white shadow-lg dark:[box-shadow:0_0_18px_4px_rgba(99,102,241,0.35)]"
                  : "text-gray-400 dark:text-[#9A9DAE]"
              }`}
            >
              <span className="text-xs font-medium">{dayNames[d.getDay()]}</span>
              <span className={`text-base sm:text-lg font-bold ${isSelected ? "text-white" : "text-gray-600 dark:text-[#E8E9F0]"}`}>{d.getDate()}</span>
              <span className={`text-xs ${isSelected ? "text-indigo-200 dark:text-indigo-200" : "text-gray-500 dark:text-[#9A9DAE]"}`}>{monthNames[d.getMonth()]}</span>
              {hasShot && (
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400"
                  style={{ boxShadow: "0 0 6px 2px rgba(45,212,191,0.5)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}