import moment from "moment";

// ─────────────────────────────────────────────────────────────────────────────
// Month grouping for the app's long lists: the one place a month key, a month
// heading and the grouping itself are worked out, so every list that groups by
// month groups the same way and says the same thing.
//
// A list is always handed to these helpers newest first, so the groups come out
// newest month first, and an entry that carries no usable date is left out of
// the grouping rather than landing in a month it does not belong to.
// ─────────────────────────────────────────────────────────────────────────────

/** The month an entry belongs to, as "2026-10". Empty when there is no date. */
export function monthKeyOf(value) {
  const m = moment(value);
  return m.isValid() ? m.format("YYYY-MM") : "";
}

/** The month's own name, as "October 2026". */
export function monthNameOf(key) {
  const m = moment(key, "YYYY-MM", true);
  return m.isValid() ? m.format("MMMM YYYY") : "";
}

/** "entry" → "entries", "shot" → "shots", "dose" → "doses". */
function pluralOf(singular) {
  if (/[^aeiou]y$/.test(singular)) return `${singular.slice(0, -1)}ies`;
  if (/(s|x|ch|sh)$/.test(singular)) return `${singular}es`;
  return `${singular}s`;
}

/** "4 entries" / "1 entry" — the count in the list's own words, both ways. */
export function monthCountText(count, singular = "entry", plural = "") {
  return `${count} ${count === 1 ? singular : plural || pluralOf(singular)}`;
}

/**
 * What a month's sticky header says. The month's own name alone — "October 2026"
 * — and, only when it is asked for (a folded month), how much is inside it.
 */
export function monthHeading(key, count = null, singular = "entry", plural = "") {
  const name = monthNameOf(key);
  if (!name) return "";
  if (count == null) return name;
  return `${name} · ${monthCountText(count, singular, plural)}`;
}

/**
 * The list in months, newest first:
 *   [{ key: "2026-10", name: "October 2026", count, items }]
 *
 * `dateOf(item)` is what decides the month. Only what is inside `items` is
 * counted and shown, so a header always describes the rows under it.
 */
export function groupByMonth(items, dateOf) {
  const groups = new Map();

  items.forEach((item) => {
    const key = monthKeyOf(dateOf(item));
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, rows]) => ({
      key,
      name: monthNameOf(key),
      count: rows.length,
      items: rows,
    }));
}

/** Every month key from `oldestKey` up to `newestKey`, newest first. */
export function monthKeysBetween(oldestKey, newestKey) {
  if (!oldestKey || !newestKey) return [];
  const keys = [];
  const cursor = moment(newestKey, "YYYY-MM", true);
  const end = moment(oldestKey, "YYYY-MM", true);
  if (!cursor.isValid() || !end.isValid() || cursor.isBefore(end)) return [];
  while (!cursor.isBefore(end)) {
    keys.push(cursor.format("YYYY-MM"));
    cursor.subtract(1, "month");
  }
  return keys;
}

/** The month keys a list of entries covers, newest first. */
export function monthKeysOf(items, dateOf) {
  const keys = new Set();
  items.forEach((item) => {
    const key = monthKeyOf(dateOf(item));
    if (key) keys.add(key);
  });
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}