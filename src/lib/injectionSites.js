import { parseShotDate } from "@/lib/dateUtils";
import { logsAsDose } from "@/lib/medicationForm";

/**
 * Every injection site the app offers, in one place: the shot form's picker, the
 * rotation card's list and the two body figures all read this table, so they
 * offer the same sites, name them the same way and place the same site on the
 * same spot of the same figure.
 *
 * A site is a fixed `id`, and every match in the app is made on it — never on the
 * wording — so no rename can ever split one site into two. `value` is what a
 * logged shot carries when the site is stored, and `label` is the only wording
 * shown on screen.
 *
 * `x` and `y` are in the figure's OWN coordinates — the space each view is drawn
 * in inside its own offset group (see src/components/shots/BodyFrames.jsx) — and
 * never in the drawing's absolute space.
 *
 * LEFT AND RIGHT ARE THE PERSON'S OWN, decided once here and followed everywhere
 * else: on the front figure their left is the viewer's right (the larger x), and
 * on the back figure, where they are facing away, it is the viewer's left (the
 * smaller x). Both figures and the list behind them use that one rule.
 */
export const SITE_VIEWS = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
];

/**
 * One row per site:
 *   id     — the fixed identifier everything matches on,
 *   value  — what a shot stores for it,
 *   label  — how it reads everywhere,
 *   view   — the figure it sits on,
 *   x, y   — where on that figure, in the figure's own coordinates,
 *   groups — the form's own route groups it belongs to: sc (subcutaneous),
 *            im (intramuscular), id (intradermal).
 */
export const INJECTION_SITES = [
  { id: "stomach_upper_left", value: "Stomach – Upper Left", label: "Stomach, upper left", view: "front", x: 59, y: 44, groups: ["sc"] },
  { id: "stomach_upper_right", value: "Stomach – Upper Right", label: "Stomach, upper right", view: "front", x: 51, y: 44, groups: ["sc"] },
  { id: "stomach_lower_left", value: "Stomach – Lower Left", label: "Stomach, lower left", view: "front", x: 59, y: 57, groups: ["sc"] },
  { id: "stomach_lower_right", value: "Stomach – Lower Right", label: "Stomach, lower right", view: "front", x: 51, y: 57, groups: ["sc"] },
  { id: "thigh_left", value: "Thigh – Left", label: "Thigh, left", view: "front", x: 61.5, y: 105, groups: ["sc"] },
  { id: "thigh_right", value: "Thigh – Right", label: "Thigh, right", view: "front", x: 48.5, y: 105, groups: ["sc"] },
  { id: "upper_arm_left", value: "Upper Arm – Left", label: "Upper arm, left", view: "front", x: 73, y: 48, groups: ["sc", "id"] },
  { id: "upper_arm_right", value: "Upper Arm – Right", label: "Upper arm, right", view: "front", x: 37, y: 48, groups: ["sc", "id"] },
  { id: "deltoid_left", value: "Deltoid – Left", label: "Deltoid, left", view: "front", x: 73, y: 34, groups: ["im"] },
  { id: "deltoid_right", value: "Deltoid – Right", label: "Deltoid, right", view: "front", x: 37, y: 34, groups: ["im"] },
  { id: "vastus_lateralis_left", value: "Vastus Lateralis – Left", label: "Vastus lateralis, left", view: "front", x: 64.5, y: 95, groups: ["im"] },
  { id: "vastus_lateralis_right", value: "Vastus Lateralis – Right", label: "Vastus lateralis, right", view: "front", x: 45.5, y: 95, groups: ["im"] },
  { id: "inner_forearm_left", value: "Inner Forearm – Left", label: "Inner forearm, left", view: "front", x: 71.5, y: 60, groups: ["id"] },
  { id: "inner_forearm_right", value: "Inner Forearm – Right", label: "Inner forearm, right", view: "front", x: 38.5, y: 60, groups: ["id"] },
  // The back figure. Its own coordinates, so a dot on the buttocks is drawn on
  // the back figure rather than out beyond the edge of the drawing.
  { id: "buttocks_left", value: "Buttocks – Left", label: "Buttocks, left", view: "back", x: 48, y: 68, groups: ["im"] },
  { id: "buttocks_right", value: "Buttocks – Right", label: "Buttocks, right", view: "back", x: 62, y: 68, groups: ["im"] },
  { id: "upper_back_left", value: "Upper Back – Left", label: "Upper back, left", view: "back", x: 48, y: 40, groups: ["id"] },
  { id: "upper_back_right", value: "Upper Back – Right", label: "Upper back, right", view: "back", x: 62, y: 40, groups: ["id"] },
  { id: "lower_back", value: "Lower Back", label: "Lower back", view: "back", x: 55, y: 56, groups: ["id"] },
  { id: "back_upper_arm_left", value: "Back of Upper Arm – Left", label: "Back of upper arm, left", view: "back", x: 37.5, y: 44, groups: ["sc", "id"] },
  { id: "back_upper_arm_right", value: "Back of Upper Arm – Right", label: "Back of upper arm, right", view: "back", x: 72.5, y: 44, groups: ["sc", "id"] },
  { id: "back_thigh_left", value: "Back of Thigh – Left", label: "Back of thigh, left", view: "back", x: 48.5, y: 105, groups: ["sc"] },
  { id: "back_thigh_right", value: "Back of Thigh – Right", label: "Back of thigh, right", view: "back", x: 61.5, y: 105, groups: ["sc"] },
];

/**
 * Wording a site was saved under before this table settled. A record keeps its
 * own value — nothing already logged is rewritten — but it counts, reads and
 * draws as the site it names.
 */
const LEGACY_SITE_NAMES = {
  "Glute – Left": "buttocks_left",
  "Glute – Right": "buttocks_right",
  "Gluindigo – Left": "buttocks_left",
  "Gluindigo – Right": "buttocks_right",
};

const BY_ID = new Map(INJECTION_SITES.map((s) => [s.id, s]));
const BY_VALUE = new Map(INJECTION_SITES.map((s) => [s.value, s]));

/** One shape for matching written text: no aside, no punctuation, no case. */
const normalise = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Every way one site may be written — its id, its stored value, its label, the
// same words in the other order ("Left thigh" for "Thigh, left"), and any wording
// it was saved under before — so that "Buttocks, left (Back)", "Buttocks – Left"
// and "Buttocks, left" all land on the one site (and therefore the one spot).
const BY_TEXT = new Map();
const indexText = (text, entry) => {
  if (!entry) return;
  const key = normalise(text);
  if (!key) return;
  if (!BY_TEXT.has(key)) BY_TEXT.set(key, entry);
  const words = key.split(" ");
  if (words.length === 2) {
    const swapped = `${words[1]} ${words[0]}`;
    if (!BY_TEXT.has(swapped)) BY_TEXT.set(swapped, entry);
  }
};
INJECTION_SITES.forEach((entry) => {
  indexText(entry.id, entry);
  indexText(entry.value, entry);
  indexText(entry.label, entry);
});
Object.entries(LEGACY_SITE_NAMES).forEach(([text, id]) => indexText(text, BY_ID.get(id)));

/**
 * The site an id, a stored value or a written name names — or null when the app
 * does not know it. This is the only way a site is resolved anywhere in the app.
 */
export function siteEntry(site) {
  const text = typeof site === "string" ? site.trim() : "";
  if (!text) return null;
  return BY_ID.get(text) || BY_VALUE.get(text) || BY_TEXT.get(normalise(text)) || null;
}

/**
 * The fixed id a site is filed under — what every count, dot and row keys on, so
 * a site logged under older or differently punctuated wording is counted with the
 * site it belongs to rather than beside it. A site the app does not know keeps its
 * own wording as its key, so it still gets a row of its own and is never dropped.
 */
export function siteKey(site) {
  return siteEntry(site)?.id || (site ? String(site).trim() : "");
}

/** "Thigh – Left" → "Thigh, left"; an unknown site reads as it was saved. */
export function siteLabel(site) {
  const entry = siteEntry(site);
  if (entry) return entry.label;
  const parts = String(site || "").split(/\s+[–—]\s+/);
  if (parts.length !== 2) return String(site || "");
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
 * recently. Each row is keyed by the site's fixed id, so older wording counts with
 * the site it names and the figures can never disagree with the list.
 */
export function siteUsage(entries) {
  const bySite = new Map();
  entries.forEach((s) => {
    const id = siteKey(s.site);
    if (!id) return;
    const row = bySite.get(id) || { id, count: 0, lastDate: s.date };
    row.count += 1;
    // Entries arrive newest first, so the first one seen is the latest; the
    // comparison keeps this correct for any order it is handed.
    if (parseShotDate(s.date) > parseShotDate(row.lastDate)) row.lastDate = s.date;
    bySite.set(id, row);
  });
  return [...bySite.values()].sort(
    (a, b) => b.count - a.count || parseShotDate(b.lastDate) - parseShotDate(a.lastDate),
  );
}

/** The id of the site used most recently — the one the outline highlights. */
export function mostRecentSite(usage) {
  let best = null;
  usage.forEach((u) => {
    if (!best || parseShotDate(u.lastDate) > parseShotDate(best.lastDate)) best = u;
  });
  return best ? best.id : null;
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
 * the suggestion works on the first shot as well as the fifth. The value returned
 * is what the form stores on the shot.
 */
export function suggestedSite(shots = [], route) {
  const sites = sitesForRoute(route);
  if (!sites.length) return "";

  const lastUsed = new Map();
  shots.forEach((s) => {
    const id = siteKey(s.site);
    if (!id) return;
    const at = parseShotDate(s.date)?.getTime() || 0;
    if (at > (lastUsed.get(id) || 0)) lastUsed.set(id, at);
  });

  let best = sites[0];
  let bestAt = Infinity;
  sites.forEach((entry) => {
    const at = lastUsed.get(entry.id) || 0;
    if (at < bestAt) { bestAt = at; best = entry; }
  });
  return best.value;
}