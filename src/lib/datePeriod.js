import moment from "moment";

// ─────────────────────────────────────────────────────────────────────────────
// The dates a long list's sheet offers (see src/components/longlist/MonthJumpButton.jsx),
// and the one place that decides whether an entry falls inside the chosen one.
//
// It is shared by every list that narrows by date — the Journal and the shot
// history — so both offer the same three periods and both read a date the same
// way. moment reads every date the app stores: a day key ("2026-10-14") and a
// logged date ("Oct 14, 2026") both land on the right day. An entry with no
// readable date is never inside a period, so a period always means a period.
// ─────────────────────────────────────────────────────────────────────────────

export const DATE_PERIODS = [
  { key: "all", label: "All dates" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

export function inDatePeriod(value, period) {
  if (!period || period === "all") return true;
  const m = moment(value);
  if (!m.isValid()) return false;
  if (period === "week") {
    return (
      m.isSameOrAfter(moment().startOf("isoWeek"), "day") &&
      m.isSameOrBefore(moment().endOf("isoWeek"), "day")
    );
  }
  if (period === "month") return m.format("YYYY-MM") === moment().format("YYYY-MM");
  return true;
}