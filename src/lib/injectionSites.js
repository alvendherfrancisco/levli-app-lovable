import { parseShotDate } from "@/lib/dateUtils";
import { logsAsDose } from "@/lib/medicationForm";

/**
 * Every injection site the app offers, in one place: the shot form's picker and
 * the rotation card both read this list, so they offer the same sites, name them
 * the same way, and place the same site on the same spot of the body.
 *
 * A site is stored on the shot as its own `value` ("Thigh – Left"), which is what
 * the records already in the database carry. `label` is how it reads on screen
 * ("Thigh, right" / "Thigh, left") and is the only wording shown anywhere.
 */

/** The two figures a site can sit on, in the order they are drawn. */
export const SITE_VIEWS = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
];

/**
 * One row per site:
 *   value  — what the shot stores (never shown to the user),
 *   label  — how it reads everywhere,
 *   view   — the figure it sits on,
 *   x, y   — where on that figure, in the drawing's own coordinates
 *            (see src/components/shots/BodyFrames.jsx),
 *   groups — the form's own lists it belongs to: sc (subcutaneous), im
 *            (intramuscular), id (intradermal).
 *
 * Left and right are the person's own, so their left is the viewer's right on the
 * front figure and the viewer's left on the back one.
 */
export const INJECTION_SITES = [
  { value: "Stomach – Upper Left", label: "Stomach, upper left", view: "front", x: 59, y: 44, groups: ["sc"] },
  { value: "Stomach – Upper Right", label: "Stomach, upper right", view: "front", x: 51, y: 44, groups: ["sc"] },
  { value: "Stomach – Lower Left", label: "Stomach, lower left", view: "front", x: 59, y: 57, groups: ["sc"] },
  { value: "Stomach – Lower Right", label: "Stomach, lower right", view: "front", x: 51, y: 57, groups: ["sc"] },
  { value: "Thigh – Left", label: "Thigh, left", view: "front", x: 61.5, y: 105, groups: ["sc"] },
  { value: "Thigh – Right", label: "Thigh, right", view: "front", x: 48.5, y: 105, groups: ["sc"] },
  { value: "Upper Arm – Left", label: "Upper arm, left", view: "front", x: 73, y: 48, groups: ["sc", "id"] },
  { value: "Upper Arm – Right", label: "Upper arm, right", view: "front", x: 37, y: 48, groups: ["sc", "id"] },
  { value: "Deltoid – Left", label: "Deltoid, left", view: "front", x: 73, y: 34, groups: ["im"] },
  { value: "Deltoid – Right", label: "Deltoid, right", view: "front", x: 37, y: 34, groups: ["im"] },
  { value: "Vastus Lateralis – Left", label: "Vastus lateralis, left", view: "front", x: 64.5, y: 95, groups: ["im"] },
  { value: "Vastus Lateralis – Right", label: "Vastus lateralis, right", view: "front", x: 45.5, y: 95, groups: ["im"] },
  { value: "Buttocks – Left", label: "Buttocks, left", view: "back", x: 138, y: 68, groups: ["im"] },
  { value: "Buttocks – Right", label: "Buttocks, right", view: "back", x: 152, y: 68, groups: ["im"] },
  { value: "Inner Forearm – Left", label: "Inner forearm, left", view: "front", x: 71.5, y: 60, groups: ["id"] },
  { value: "Inner Forearm – Right", label: "Inner forearm, right", view: "front", x: 38.5, y: 60, groups: ["id"] },
  { value: "Upper Back – Left", label: "Upper back, left", view: "back", x: 138, y: 40, groups: ["id"] },
  { value: "Upper Back – Right", label: "Upper back, right", view: "back", x: 152, y: 40, groups: ["id"] },
];

/**
 * Wording a site was saved under before this list settled. A record keeps its own
 * value — nothing already logged is rewritten — but it counts, reads and draws as
 * the site it names.
 */
const SITE_ALIASES = {
  "Glute – Left": "Buttocks – Left",
  "Glute – Right": "Buttocks – Right",
  "Gluindigo – Left": "Buttocks – Left",
  "Gluindigo – Right": "Buttocks – Right",
};

const BY_VALUE = new Map(INJECTION_SITES.map((s) => [s.value, s]));

/** The site a stored value names, or null when the app does not know it. */
export function siteEntry(site) {
  if (!site) return null;
  return BY_VALUE.get(site) || BY_VALUE.get(SITE_ALIASES[site]) || null;
}

/**
 * The value a site is filed under: what the app stores today for it. Every count,
 * dot and row uses this, so a site logged under older wording is counted with the
 * site it belongs to rather than beside it. An unknown site keeps its own wording.
 */
export function siteKey(site) {
  return siteEntry(site)?.value || site || "";
}

/** "Thigh – Left" → "Thigh, left"; an unknown site reads as it was saved. */
export function siteLabel(site) {
  const entry = siteEntry(site);
  if (entry) return entry.label;
  const parts = String(site || "").split(/\s+[–—]\s+/);
  if (parts.length !== 2) return site || "";
  const [area, where] = parts;
  return `${area}, ${where.charAt(0).toLowerCase()}${where.slice(1)}`;
}

/** Where the site sits on the outline — { view, x, y } — or null if unknown. */
export function sitePoint(site) {
  const entry = siteEntry(site);
  return entry ? { view: entry.view, x: entry.x, y: entry.y } : null;
}

/** The figure a site sits on: "front", "back", or "" when unknown. */
export function siteView(site) {
  return siteEntry(site)?.view || "";
}

/** The figure's own name ("Front" / "Back") for a site, or "" when unknown. */
export function siteViewLabel(site) {
  const view = siteView(site);
  return SITE_VIEWS.find((v) => v.key === view)?.label || "";
}

/** The sites the shot form offers for a route. */
export function sitesForRoute(route) {
  const group = route === "intramuscular" ? "im" : route === "intradermal" ? "id" : "sc";
  return INJECTION_SITES.filter((s) => s.groups.includes(group));
}

/**
 * The injections with a site logged in the last `days` days, newest first. A shot
 * without a site is left out — this is about where the doses went — and so is a
 * tablet: an oral dose is not placed anywhere, so it is never part of a rotation,
 * even where an old record still carries a site.
 */
export function shotsInSiteWindow(shots, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return shots
    .filter((s) => {
      if (!s.site || logsAsDose(s.medication, { route: s.route })) return false;
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
 * recently. Each row is filed under the site's own key (see siteKey), so older
 * wording counts with the site it names.
 */
export function siteUsage(entries) {
  const bySite = new Map();
  entries.forEach((s) => {
    const key = siteKey(s.site);
    if (!key) return;
    const row = bySite.get(key) || { site: key, count: 0, lastDate: s.date };
    row.count += 1;
    // Entries arrive newest first, so the first one seen is the latest; the
    // comparison keeps this correct for any order it is handed.
    if (parseShotDate(s.date) > parseShotDate(row.lastDate)) row.lastDate = s.date;
    bySite.set(key, row);
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

/**
 * The site to suggest next: the one this route offers that was used longest ago,
 * so the rotation keeps moving. A site never used comes before any used one, so
 * the suggestion works on the first shot as well as the fifth.
 */
export function suggestedSite(shots = [], route) {
  const sites = sitesForRoute(route);
  if (!sites.length) return "";

  const lastUsed = new Map();
  shots.forEach((s) => {
    const key = siteKey(s.site);
    if (!key) return;
    const at = parseShotDate(s.date)?.getTime() || 0;
    if (at > (lastUsed.get(key) || 0)) lastUsed.set(key, at);
  });

  let best = sites[0];
  let bestAt = Infinity;
  sites.forEach((entry) => {
    const at = lastUsed.get(entry.value) || 0;
    if (at < bestAt) { bestAt = at; best = entry; }
  });
  return best.value;
}