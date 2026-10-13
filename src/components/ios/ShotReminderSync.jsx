import { useEffect, useRef } from "react";
import { useAppState } from "@/lib/AppState";
import { medicationSummaries, isActiveMedication } from "@/lib/medicationLink";
import { DEFAULT_REMINDER_TIME } from "@/lib/medicationSchedule";
import { isRunningInIOSWrapper } from "@/lib/iosBridge";
import usePushPermission from "@/hooks/usePushPermission";
import { isPushOn } from "@/lib/pushPermission";
import { schedShotDue, cancelShotDue } from "@/utils/pushTriggers";

const addDays = (key, n) => {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d;
};

// The earliest upcoming dose across active medications, at its reminder time.
function nextReminder(summaries) {
  const now = Date.now();
  let best = null;
  for (const s of summaries) {
    if (!isActiveMedication(s.medication) || s.medication.reminder_time === "") continue;
    let day = s.nextKey ? new Date(`${s.nextKey}T00:00:00`) : s.lastShot?.date && s.intervalDays ? addDays(s.lastShot.date, s.intervalDays) : null;
    if (!day) continue;
    const [h, m] = (s.medication.reminder_time || DEFAULT_REMINDER_TIME).split(":").map(Number);
    day.setHours(h || 0, m || 0, 0, 0);
    while (day.getTime() <= now && s.intervalDays) day.setDate(day.getDate() + s.intervalDays);
    if (day.getTime() > now && (!best || day < best)) best = day;
  }
  return best;
}

// Re-arms "shot.due" whenever a shot, medication or repeat schedule changes —
// those saves are the behaviour that moves the next dose. Replaces in place.
export default function ShotReminderSync() {
  const { medications, shots, repeatSchedules, profile } = useAppState();
  const { status } = usePushPermission();
  const last = useRef(null);

  useEffect(() => {
    if (!isRunningInIOSWrapper() || !isPushOn(status) || !medications) return;
    const next = nextReminder(medicationSummaries({ medications, shots, repeatSchedules, profile }));
    const key = next ? next.getTime() : 0;
    if (key === last.current) return;
    last.current = key;
    next ? schedShotDue(next) : cancelShotDue();
  }, [medications, shots, repeatSchedules, profile, status]);

  return null;
}