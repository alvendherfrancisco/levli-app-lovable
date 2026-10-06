import { useEffect } from "react";

/**
 * Startup and mount counting, for when you want numbers instead of opinions.
 *
 * Off by default. Turn it on with `?perf=1` on the app's URL, or by running
 * `localStorage.setItem("levli:perf", "1")` once in the browser console — the
 * setting survives reloads, so a cold start, a login and a tap through the tabs
 * can all be compared in one sitting. Turn it off with
 * `localStorage.removeItem("levli:perf")`.
 *
 * It prints one line per event:
 *   [levli perf] app first render — 240ms
 *   [levli perf] navigator mounted (splash finished) — 1520ms
 *   [levli perf] Home mounted — #1, 1544ms
 *   [levli perf] startup data loaded — 2610ms
 *
 * "Home mounted — #2" after a tap is the bug this exists to catch: a screen
 * mounting twice means something remounted the tree. Nothing here runs unless
 * the probe is switched on.
 */

const enabled = (() => {
  try {
    return (
      new URLSearchParams(window.location.search).get("perf") === "1" ||
      window.localStorage.getItem("levli:perf") === "1"
    );
  } catch {
    return false;
  }
})();

const startedAt = enabled && typeof performance !== "undefined" ? performance.now() : 0;
const mounts = new Map();

const since = () => Math.round(performance.now() - startedAt);

/** Records a moment in startup, with the time since the bundle started running. */
export function perfMark(label) {
  if (!enabled) return;
  console.log(`[levli perf] ${label} — ${since()}ms`);
}

/** Reports every mount of the component it is used in, and how many there have been. */
export function useMountProbe(label) {
  useEffect(() => {
    if (!enabled) return;
    const count = (mounts.get(label) || 0) + 1;
    mounts.set(label, count);
    console.log(`[levli perf] ${label} mounted — #${count}, ${since()}ms`);
  }, [label]);
}