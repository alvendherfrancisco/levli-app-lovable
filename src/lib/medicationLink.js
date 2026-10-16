// Linking shot logs and medications: one source of truth, without merging them.
//
// A Medication record is the regimen — what is prescribed now, and the defaults
// a new log starts from. A Shot is history — what was actually taken, keeping
// its own snapshot of the name, dose and unit exactly as logged, plus a
// medication_id pointing at the regimen it belongs to.
//
// Editing a medication therefore changes what the next log starts with and
// nothing that has already been recorded.

import { todayKey } from "@/lib/dateUtils";
import { getNextOccurrence } from "@/lib/repeatSchedule";
import { effectiveDaysBetween } from "@/lib/medicationConfig";

// A regimen is either running or archived — there is no third state to be left
// in. A record with no status at all (saved before statuses existed) counts as
// the ordinary active one.
export const MED_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
};

export const isArchivedMedication = (medication) => medication?.status === MED_STATUS.ARCHIVED;
export const isActiveMedication = (medication) => !isArchivedMedication(medication);

/** A regimen carrying no schedule pressure: no reminders, no next-shot date. */
export const isHaltedMedication = (medication) => isArchivedMedication(medication);

/**
 * The medications a shot picker may offer: only the active ones — plus the one
 * this log already belongs to, so an old entry is never stranded when its
 * medication has since been archived.
 */
export function pickerMedications(medications = [], current = null) {
  const active = medications.filter(isActiveMedication);
  if (!current?.medication_name) return active;
  if (active.some((m) => m.medication_name === current.medication_name)) return active;
  return [...active, current];
}

/** The shots belonging to one medication: by link when present, by logged name otherwise. */
export function shotsOfMedication(shots = [], medication) {
  if (!medication?.medication_name && !medication?.id) return [];
  return shots.filter((s) => (s.medication_id
    ? s.medication_id === medication.id
    : s.medication === medication.medication_name));
}

/** How many logs each medication has, keyed by medication id (and by name when unlinked). */
export function shotCountsByMedication(shots = [], medications = []) {
  const counts = {};
  medications.forEach((m) => { counts[m.id] = shotsOfMedication(shots, m).length; });
  return counts;
}

/** Whether a repeat schedule belongs to a medication. */
export function scheduleMatchesMedication(schedule, medication) {
  if (!schedule || !medication) return false;
  if (schedule.medication_id && medication.id) return schedule.medication_id === medication.id;
  return schedule.medication === medication.medication_name;
}

/** "once weekly" / "once daily" as a number of days, when the wording is one we know. */
export function frequencyToDays(frequency) {
  const text = String(frequency || "").toLowerCase();
  if (!text) return null;
  if (/daily|every day|once a day|a day/.test(text)) return 1;
  if (/weekly|once a week|every week|a week/.test(text)) return 7;
  if (/fortnight|every other week|biweekly|two weeks|2 weeks/.test(text)) return 14;
  if (/monthly|every month|once a month/.test(text)) return 30;
  return null;
}

/** The interval this medication is dosed at: its own schedule, else the label. */
export function medicationIntervalDays(medication, profile) {
  // The schedule saved on the medication decides first, so a twice-weekly or
  // every-X-days plan is counted from its own interval rather than guessed.
  const stated = Number(medication?.interval_days);
  if (Number.isFinite(stated) && stated > 0) return stated;
  return frequencyToDays(medication?.frequency)
    || effectiveDaysBetween(profile, medication?.medication_name, medication);
}

/** The current name of the medication a shot points at, when it has been renamed. */
export function renamedTo(shot, medications = []) {
  if (!shot?.medication_id) return "";
  const med = medications.find((m) => m.id === shot.medication_id);
  if (!med?.medication_name || med.medication_name === shot.medication) return "";
  return med.medication_name;
}

/** The name to show for a logged shot: its snapshot, plus the current name when renamed. */
export function shotMedicationName(shot, medications = []) {
  const renamed = renamedTo(shot, medications);
  return renamed ? `${shot.medication || ""} (now ${renamed})` : (shot?.medication || "");
}

/**
 * One entry per medication for the home screen: its last dose, how many doses
 * it has, the interval it runs at, its repeat schedule and the next date that
 * schedule falls on.
 */
export function medicationSummaries({ medications = [], shots = [], repeatSchedules = [], profile }) {
  return medications.map((medication) => {
    const mine = shotsOfMedication(shots, medication);
    const schedule = repeatSchedules.find(
      (s) => s.status === "active" && scheduleMatchesMedication(s, medication)
    ) || null;
    return {
      medication,
      lastShot: mine[0] || null,
      totalShots: mine.length,
      intervalDays: medicationIntervalDays(medication, profile),
      schedule,
      nextKey: schedule ? getNextOccurrence(schedule, todayKey()) : null,
    };
  });
}