import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import { sound } from "@/lib/sounds";

/**
 * The day strip on Home: five days in view, the day in hand in the middle.
 *
 * The day in hand's container never moves. It is drawn once, held at the middle
 * of the strip in exactly the shape, size and colour the chosen day has always
 * had, and it stays there while the dates travel behind it: dragging the row
 * left or right slides the days under the container, and the one that comes to
 * rest inside it becomes the day in hand. The strip therefore reads like the
 * middle slot of a picker rather than a row that jumps.
 *
 * At rest the strip is exactly what it was: the same five days across the same
 * width, each tile a fifth of it, the container the middle one. The days
 * outside it are drawn beneath it (they slide behind it); the day inside it is
 * lifted above it, so its own white lettering sits on the container's fill just
 * as a selected tile always has.
 *
 * The window of days is built around the day in hand and re-centred on it, so
 * the row always comes to rest with that day in the middle: the days either
 * side are the same before and after a re-centre, which is why the strip never
 * appears to jump.
 */
const EACH_SIDE = 30;     // days reachable either side of the day in hand
const CENTER = EACH_SIDE; // the middle slot: the day in hand's container
const SETTLE_MS = 140;    // how long the dates must stop before a day is chosen

export default function DateStrip({ selectedDate, onSelectDate }) {
  const { shots } = useAppState();
  const today = new Date();
  const selected = selectedDate || today;
  const selectedKey = toDayKey(selected);

  const scrollerRef = useRef(null);
  // The tile's own width and the distance between two tiles, read from the row
  // itself (see measure) rather than assumed, so the maths holds at any text
  // size or screen width.
  const metricsRef = useRef({ tileW: 0, step: 0 });
  const settleRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(CENTER);

  const shotDayKeys = new Set(shots.map((s) => {
    const d = parseShotDate(s.date);
    return d ? toDayKey(d) : null;
  }).filter(Boolean));

  // The window of days, centred on the day in hand.
  const days = [];
  for (let i = -EACH_SIDE; i <= EACH_SIDE; i++) {
    const d = new Date(selected);
    d.setDate(selected.getDate() + i);
    days.push(d);
  }

  const measure = () => {
    const el = scrollerRef.current;
    const first = el && el.children[0];
    const second = el && el.children[1];
    if (!first || !second) return;
    metricsRef.current = { tileW: first.offsetWidth, step: second.offsetLeft - first.offsetLeft };
  };

  /** The day sitting in the container at a given scroll position. */
  const indexAt = (scrollLeft) => {
    const el = scrollerRef.current;
    const { tileW, step } = metricsRef.current;
    if (!el || !step) return CENTER;
    const raw = (scrollLeft + (el.clientWidth - tileW) / 2) / step;
    return Math.max(0, Math.min(days.length - 1, Math.round(raw)));
  };

  /** The scroll position that puts a day in the container. */
  const leftFor = (index) => {
    const el = scrollerRef.current;
    const { tileW, step } = metricsRef.current;
    if (!el || !step) return null;
    return index * step - Math.max(0, (el.clientWidth - tileW) / 2);
  };

  const bringToCenter = (index, behavior = "auto") => {
    const el = scrollerRef.current;
    const left = leftFor(index);
    if (!el || left == null) return;
    if (Math.abs(el.scrollLeft - left) < 1) return;
    el.scrollTo({ left, behavior });
  };

  // Runs before the first paint, so the day in hand is in the middle from the
  // very first frame, and again whenever it changes — including when another
  // screen or control picks a different day.
  useLayoutEffect(() => {
    measure();
    bringToCenter(CENTER);
  }, [selectedKey]);

  useEffect(() => {
    const onResize = () => { measure(); bringToCenter(CENTER); };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(settleRef.current);
    };
  }, []);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    // Which day is in the container right now — followed frame by frame, so the
    // day arriving under it is already drawn in it.
    const index = indexAt(el.scrollLeft);
    setActiveIndex((prev) => (prev === index ? prev : index));

    // And once the dates have stopped moving, that day is the day in hand.
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const node = scrollerRef.current;
      if (!node) return;
      const settled = indexAt(node.scrollLeft);
      setActiveIndex(settled);
      const day = days[settled];
      if (day && toDayKey(day) !== selectedKey) onSelectDate?.(new Date(day));
      // Already the day in hand: just sit square in its container.
      else bringToCenter(CENTER);
    }, SETTLE_MS);
  };

  const pickDay = (index) => {
    sound.tap();
    // The chosen day travels into the container and, on coming to rest there,
    // becomes the day in hand.
    bringToCenter(index, "smooth");
  };

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    // 12px side margin, to line the first and last tile up with the cards
    // below; 24px below the strip, so the day in hand sits clear of the card
    // that follows.
    <div className="relative px-3 pt-3 pb-6">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex gap-1.5 overflow-x-auto overscroll-x-contain no-scrollbar snap-x snap-mandatory"
      >
        {days.map((d, index) => {
          const key = toDayKey(d);
          const isSelected = key === selectedKey;
          const inContainer = index === activeIndex;
          const hasShot = shotDayKeys.has(key);
          return (
            <button
              // Keyed by position: the row is uniform, so a re-centred window
              // keeps its tiles and only the dates inside them change.
              key={index}
              type="button"
              onClick={() => pickDay(index)}
              aria-current={isSelected ? "date" : undefined}
              // The same tile as always — a fifth of the strip's width, the
              // same three lines inside it — but carrying no fill of its own:
              // the container behind it is what draws the chosen day.
              style={{ width: "calc((100% - 24px) / 5)" }}
              className={`date-chip relative flex shrink-0 snap-center min-w-0 min-h-[90px] py-[14px] flex-col items-center justify-center gap-1.5 transition-colors ${
                inContainer ? "z-20 text-white" : "z-0 text-gray-400 dark:text-[#9A9DAE]"
              }`}
            >
              <span className="text-[10px] font-medium leading-[1.3]">{dayNames[d.getDay()]}</span>
              <span className={`text-[15px] font-bold leading-[1.3] ${inContainer ? "text-white" : "text-gray-600 dark:text-[#E8E9F0]"}`}>{d.getDate()}</span>
              <span className={`text-[10px] leading-[1.3] ${inContainer ? "text-indigo-200" : "text-gray-500 dark:text-[#9A9DAE]"}`}>{monthNames[d.getMonth()]}</span>
              {hasShot && (
                <div
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400"
                  style={{ boxShadow: "0 0 6px 2px rgba(45,212,191,0.5)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* The day in hand's container: held at the middle, in the shape and
          colour the chosen day has always had, while the dates travel behind
          it. Centred at one tile's width — 48px is the four 6px gaps the five
          visible tiles leave, so it lands exactly on the tile inside it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-3 bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-[22px] bg-indigo-600 dark:bg-indigo-500/80 shadow-lg dark:[box-shadow:0_0_18px_4px_rgba(99,102,241,0.35)]"
        style={{ width: "calc((100% - 48px) / 5)" }}
      />
    </div>
  );
}