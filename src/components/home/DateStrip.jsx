import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey } from "@/lib/dateUtils";
import { sound } from "@/lib/sounds";

/**
 * The day strip on Home: five days in view, the day in hand in the middle.
 *
 * The row is fixed. It holds fifteen days — the seven either side of today —
 * built once and keyed by date, so choosing a day never rebuilds the list and
 * never re-creates a tile: the only thing a choice changes is which day is drawn
 * as chosen. The row is therefore never moved on its own, and never fights the
 * finger that is moving it.
 *
 * The day in hand's tile is drawn in exactly the shape, size and colour it has
 * always had, and the row's own snapping keeps a tile under the middle of the
 * strip, so the day the dates come to rest on is the day in hand. Dragging slides
 * the days under the finger; the day that settles in the middle becomes the day
 * in hand. Tapping a day chooses it at once and asks the row for one smooth
 * movement to bring it into the middle, after which the row is left exactly where
 * it stopped.
 *
 * The window is built around today, so the day in hand is always inside it; a
 * selection arriving from elsewhere simply draws as chosen, wherever it sits.
 */
const EACH_SIDE = 7;       // the seven days either side of today: fifteen in all
const SETTLE_MS = 140;     // how long the dates must stop before a day is chosen
const TAP_TRAVEL_MS = 900; // how long a tapped day may take to reach the middle

export default function DateStrip({ selectedDate, onSelectDate }) {
  const { shots } = useAppState();
  const today = new Date();
  const selected = selectedDate || today;
  const selectedKey = toDayKey(selected);
  const todayKey = toDayKey(today);

  const scrollerRef = useRef(null);
  // The tile's own width and the distance between two tiles, read from the row
  // itself (see measure) rather than assumed, so the maths holds at any text
  // size or screen width.
  const metricsRef = useRef({ tileW: 0, step: 0 });
  const settleRef = useRef(null);
  // Until this moment the row is travelling because a day was just tapped. That
  // day is already the day in hand, so its movement chooses nothing further.
  const tapTravelRef = useRef(0);
  // The day sitting in the middle slot while the dates are being moved, so the
  // tile arriving there is already drawn as chosen. Null when nothing is moving.
  const [slidIndex, setSlidIndex] = useState(null);

  // Fifteen days, fixed: built once, and rebuilt only when the date itself
  // changes — never around the day in hand.
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const list = [];
    for (let i = -EACH_SIDE; i <= EACH_SIDE; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, [todayKey]);

  // Where the day in hand sits in the fixed window — today's slot when it lies
  // outside the window altogether.
  const selectedIndex = useMemo(() => {
    const i = days.findIndex((d) => toDayKey(d) === selectedKey);
    return i >= 0 ? i : EACH_SIDE;
  }, [days, selectedKey]);

  // Always the current value, for the one-off work below (the first paint and a
  // resize) without making it a dependency that would re-run that work.
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const activeIndex = slidIndex ?? selectedIndex;

  // Which days carry a shot. Held between renders so a drag never rebuilds it.
  const shotDayKeys = useMemo(() => new Set(shots.map((s) => {
    const d = parseShotDate(s.date);
    return d ? toDayKey(d) : null;
  }).filter(Boolean)), [shots]);

  const measure = () => {
    const el = scrollerRef.current;
    const first = el && el.children[0];
    const second = el && el.children[1];
    if (!first || !second) return;
    metricsRef.current = { tileW: first.offsetWidth, step: second.offsetLeft - first.offsetLeft };
  };

  /** The day sitting in the middle slot at a given scroll position. */
  const indexAt = (scrollLeft) => {
    const el = scrollerRef.current;
    const { tileW, step } = metricsRef.current;
    if (!el || !step) return EACH_SIDE;
    const raw = (scrollLeft + (el.clientWidth - tileW) / 2) / step;
    return Math.max(0, Math.min(days.length - 1, Math.round(raw)));
  };

  /** The scroll position that puts a day in the middle slot. */
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

  // The row starts with the day in hand in the middle: on the first paint, and
  // again if the window itself is rebuilt or the screen is resized. Choosing a
  // day is deliberately not in this list — a selection never moves the row, which
  // is what keeps the strip still while the screen below it reloads.
  useLayoutEffect(() => {
    measure();
    bringToCenter(selectedIndexRef.current);
  }, [days]);

  useEffect(() => {
    const onResize = () => { measure(); bringToCenter(selectedIndexRef.current); };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(settleRef.current);
    };
  }, []);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    // The row is travelling because a day was just tapped: that day is already
    // the day in hand, so its own movement chooses nothing and nothing follows it.
    if (Date.now() < tapTravelRef.current) return;

    // The day in the middle slot right now — followed frame by frame, so the tile
    // arriving there is already drawn as chosen.
    const index = indexAt(el.scrollLeft);
    setSlidIndex((prev) => (prev === index ? prev : index));

    // And once the dates have stopped moving, that day is the day in hand. The
    // row is left exactly where the snapping put it.
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const node = scrollerRef.current;
      if (!node) return;
      const settled = indexAt(node.scrollLeft);
      setSlidIndex(null);
      const day = days[settled];
      if (day && toDayKey(day) !== selectedKey) onSelectDate?.(new Date(day));
    }, SETTLE_MS);
  };

  const pickDay = (index) => {
    sound.tap();
    // Chosen now, and moved once: the row travels smoothly to bring the day into
    // the middle (or as close to it as the window's end allows) and is then left
    // alone.
    tapTravelRef.current = Date.now() + TAP_TRAVEL_MS;
    onSelectDate?.(new Date(days[index]));
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
        // A finger on the row always takes it over.
        onPointerDown={() => { tapTravelRef.current = 0; }}
        className="flex gap-1.5 overflow-x-auto overscroll-x-contain no-scrollbar snap-x snap-mandatory"
      >
        {days.map((d, index) => {
          const key = toDayKey(d);
          const chosen = index === activeIndex;
          const hasShot = shotDayKeys.has(key);
          return (
            <button
              // Keyed by date, so the day in hand changing re-draws a tile rather
              // than re-creating one — nothing in the row is rebuilt or moved.
              key={key}
              type="button"
              onClick={() => pickDay(index)}
              aria-current={key === selectedKey ? "date" : undefined}
              // The tile as it has always been — a fifth of the strip's width,
              // the same three lines inside it — carrying the chosen day's own
              // fill so the day in hand is drawn where it stands.
              style={{ width: "calc((100% - 24px) / 5)" }}
              className={`date-chip relative flex shrink-0 snap-center min-w-0 min-h-[90px] py-[14px] flex-col items-center justify-center gap-1.5 transition-colors ${
                chosen
                  ? "text-white bg-indigo-600 dark:bg-indigo-500/80 shadow-lg dark:[box-shadow:0_0_18px_4px_rgba(99,102,241,0.35)]"
                  : "text-gray-400 dark:text-[#9A9DAE]"
              }`}
            >
              <span className="text-[10px] font-medium leading-[1.3]">{dayNames[d.getDay()]}</span>
              <span className={`text-[15px] font-bold leading-[1.3] ${chosen ? "text-white" : "text-gray-600 dark:text-[#E8E9F0]"}`}>{d.getDate()}</span>
              <span className={`text-[10px] leading-[1.3] ${chosen ? "text-indigo-200" : "text-gray-500 dark:text-[#9A9DAE]"}`}>{monthNames[d.getMonth()]}</span>
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
    </div>
  );
}