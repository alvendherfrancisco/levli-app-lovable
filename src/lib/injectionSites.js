import { parseShotDate } from "@/lib/dateUtils";

/**
 * The injection sites the app offers, named for reading and placed on the body
 * outline the rotation card draws.
 *
 * A site is stored as it was logged ("Thigh – Left"), so this module is the one
 * place that turns that into something to read ("Left thigh") and into a point
 * on the front or the back figure. A site the app does not know — a compounded
 * product's own wording, a site typed in by hand — simply has no point: it is
 * left off the outline while still being counted in the list under it.
 */

// Where each known site sits on its figure, in the outline's own 200 × 150
// coordinates (see src/components/shots/BodyOutline.jsx). The abdomen, the limbs
// and the shoulders are drawn from the front; the back and the glutes from
// behind. Left and right are the person's own, so their left is the viewer's
// right on the front figure and the viewer's left on the back one.
const POINTS = {
  "Stomach – Upper Left": { view: "front", x: 59, y: 44 },
  "Stomach – Upper Right": { view: "front", x: 51, y: 44 },
  "Stomach – Lower Left": { view: "front", x: 59, y: 57 },
  "Stomach – Lower Right": { view: "front", x: 51, y: 57 },
  "Thigh – Left": { view: "front", x: 61.5, y: 105 },
  "Thigh – Right": { view: "front", x: 48.5, y: 105 },
  "Vastus Lateralis – Left": { view: "front", x: 64.5, y: 95 },
  "Vastus Lateralis – Right": { view: "front", x: 45.5, y: 95 },
  "Upper Arm – Left": { view: "front", x: 73, y: 48 },
  "Upper Arm – Right": { view: "front", x: 37, y: 48 },
  "Deltoid – Left": { view: "front", x: 73, y: 34 },
  "Deltoid – Right": { view: "front", x: 37, y: 34 },
  "Inner Forearm – Left": { view: "front", x: 71.5, y: 60 },
  "Inner Forearm – Right": { view: "front", x: 38.5, y: 60 },
  "Upper Back – Left": { view: "back", x: 138, y: 40 },
  "Upper Back – Right": { view: "back", x: 152, y: 40 },
  "Gluindigo – Left": { view: "back", x: 138, y: 68 },
  "Gluindigo – Right": { view: "back", x: 152, y: 68 },
};

/** The point on the outline a site is drawn at, or null when it has none. */
export function sitePoint(site) {
  return POINTS[site] || null;
}

/** "Thigh – Left" → "Left thigh"; anything the app does not split stays as logged. */
export function siteDisplayName(site) {
  if (!site) return "";
  const parts = site.split(/\s+[–—]\s+/);
  if (parts.length !== 2) return site;
  const [area, where] = parts;
  const name = `${where.toLowerCase()} ${area.toLowerCase()}`;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * The shots with a site logged in the last `days` days, newest first. A shot
 * without a site is left out — this card is about where the doses went.
 */
export function shotsInSiteWindow(shots, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return shots
    .filter((s) => {
      if (!s.site) return false;
      const sd = parseShotDate(s.date);
      if (!sd) return false;
      const daysSince = Math.round((today - sd) / 86400000);
      return daysSince >= 0 && daysSince <= days;
    })
    .sort((a, b) => parseShotDate(b.date) - parseShotDate(a.date));
}

/**
 * The sites those entries used: how often each was used and when it was last
 * used, most used first. Equally used sites are ordered by which was used most
 * recently.
 */
export function siteUsage(entries) {
  const bySite = new Map();
  entries.forEach((s) => {
    const row = bySite.get(s.site) || { site: s.site, count: 0, lastDate: s.date };
    row.count += 1;
    // Entries arrive newest first, so the first one seen is the latest; the
    // comparison keeps this correct for any order it is handed.
    if (parseShotDate(s.date) > parseShotDate(row.lastDate)) row.lastDate = s.date;
    bySite.set(s.site, row);
  });
  return [...bySite.values()].sort(
    (a, b) => b.count - a.count || parseShotDate(b.lastDate) - parseShotDate(a.lastDate),
  );
}

/** The site used most recently — the one the outline highlights. */
export function mostRecentSite(usage) {
  let best = null;
  usage.forEach((u) => {
    if (!best || parseShotDate(u.lastDate) > parseShotDate(best.lastDate)) best = u;
  });
  return best ? best.site : null;
}

/**
 * A gentle nudge when one site is carrying the rotation: it only speaks up once
 * a site has been used three times, and only when it has been used at least
 * twice as often as the next one. Empty when the rotation looks even.
 */
export function siteSkewHint(usage) {
  const top = usage[0];
  if (!top || top.count < 3) return "";
  const next = usage[1] ? usage[1].count : 0;
  if (usage.length > 1 && top.count < 2 * next) return "";
  return "Try a different site next time.";
}