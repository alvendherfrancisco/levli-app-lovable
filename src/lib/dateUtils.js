// Shared date utilities.
// All date construction uses LOCAL time (new Date(y, m, d)) to avoid UTC
// drift. Dose scheduling uses calendar-day arithmetic, not absolute-time
// arithmetic, so DST transitions do not shift a scheduled dose by an hour.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_IDX = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };

/** "Jun 29, 2026" → Date at midnight local */
export function parseShotDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.replace(",", "").split(" ");
  return new Date(parseInt(parts[2]), MONTH_IDX[parts[0]] ?? 0, parseInt(parts[1]));
}

/** Date → "Jun 29, 2026" */
export function formatShotDate(date) {
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2,"0")}, ${date.getFullYear()}`;
}

/** Date → "YYYY-MM-DD" — constructed from local components, never UTC */
export function toDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/** "YYYY-MM-DD" → Date at midnight local (avoids UTC parsing drift) */
export function fromDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Jun 29, 2026" + N days → "Jun 29, 2026" — calendar-day arithmetic, DST-safe */
export function addDaysToShotDate(dateStr, days) {
  const d = parseShotDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatShotDate(d);
}

/** days until a "Jun 29, 2026" date from today — compares calendar days, not timestamps */
export function daysUntilShotDate(dateStr) {
  const d = parseShotDate(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

/** how many days ago a "Jun 29, 2026" date was */
export function daysAgoLabel(dateStr) {
  const diff = -daysUntilShotDate(dateStr);
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export function todayKey() {
  return toDayKey(new Date());
}

/** A date in the device's own short format, e.g. "Jun 29, 2026" or "29 Jun 2026". */
export function formatLocaleDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** "YYYY-MM-DD" → "Aug 1" — compact captions such as a date range. */
export function formatDayKeyShort(key) {
  if (!key) return "";
  const d = fromDayKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Days between two "Jun 29, 2026" date strings — calendar-day count, DST-safe.
 * Uses Date-only subtraction then rounds. Because both endpoints are pinned
 * to local midnight, a DST transition between them affects the millisecond
 * count by ±1h but the round() corrects it back to the calendar-day count.
 */
export function calendarDaysBetween(startDateStr, endDateStr) {
  // Handles both "Mon DD, YYYY" (shot dates) and "YYYY-MM-DD" (day keys)
  const a = (startDateStr && startDateStr.includes("-") && !startDateStr.includes(",")) ? fromDayKey(startDateStr) : parseShotDate(startDateStr);
  const b = (endDateStr && endDateStr.includes("-") && !endDateStr.includes(",")) ? fromDayKey(endDateStr) : parseShotDate(endDateStr);
  if (!a || !b) return 0;
  a.setHours(0,0,0,0);
  b.setHours(0,0,0,0);
  return Math.round((b - a) / 86400000);
}

/**
 * Parse an <input type="datetime-local"> value into a Date in local time.
 * Avoids the "Z" UTC interpretation that Date() would apply.
 */
export function parseLocalDateTime(value) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0);
}

/**
 * A logged dose time, stored as "9:00 AM", as a form's own time value "09:00".
 * The two are written differently — the log keeps the 12-hour form the user read
 * back, the field needs the 24-hour one — so the reading happens in one place.
 * Anything unreadable gives "", never a guessed time.
 */
export function inputTimeFromShotTime(shotTime) {
  if (!shotTime) return "";
  const match = String(shotTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let h = Number(match[1]);
  const m = Number(match[2]);
  const ampm = (match[3] || "").toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  if (h > 23 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * A logged dose's moment on the timeline, as a comparable number: its own date
 * and time. Doses are ordered by when they happened, never by when they were
 * typed in, so an older entry added later never becomes the latest dose — and
 * the next dose, worked out from the latest one, does not move for it.
 */
export function shotMoment(shot) {
  const d = parseShotDate(shot?.date);
  if (!d) return 0;
  const [h, m] = inputTimeFromShotTime(shot?.time).split(":").map(Number);
  const minutes = Number.isFinite(h) ? h * 60 + (m || 0) : 0;
  return d.getTime() + minutes * 60000;
}

/** Newest dose first, by the moment it happened (see shotMoment). */
export function byShotMomentDesc(a, b) {
  return shotMoment(b) - shotMoment(a);
}