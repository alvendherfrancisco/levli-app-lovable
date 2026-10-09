import { APP_VERSION } from "@/lib/appInfo";
import { plainBrandName } from "@/lib/medicationConfig";

/**
 * A medication column written as the plain name — no ® or ™ — so the file reads
 * cleanly in a spreadsheet. Only the export is stripped: the stored record, the
 * app's screens and its reports keep the name as it was selected.
 */
const plainMedicationColumn = (rows, field) =>
  (Array.isArray(rows) ? rows.map((row) => ({ ...row, [field]: plainBrandName(row[field]) })) : rows);

/** Escapes one CSV cell. */
const cell = (value) => {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rows (objects) to a CSV block; columns are the keys of the first row. */
export function toCsv(rows) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const lines = [columns.join(",")];
  rows.forEach((row) => lines.push(columns.map((c) => cell(row[c])).join(",")));
  return lines.join("\n");
}

/**
 * One CSV file holding every record the account has stored. Sections are
 * separated by a blank line with a readable heading, so the file opens cleanly
 * in a spreadsheet and still makes sense read as plain text.
 */
export function buildFullExportCsv(data) {
  const sections = [
    ["Shots", plainMedicationColumn(data.shots, "medication")],
    ["Daily metrics", data.dayMetrics],
    ["Journal entries", data.journalEntries],
    ["Side effects", data.adverseEvents],
    ["Medications", plainMedicationColumn(data.medications, "medication_name")],
    ["Inventory", data.inventory],
    ["Repeat schedules", plainMedicationColumn(data.repeatSchedules, "medication")],
    ["Caregiver access", data.proxyAccess],
  ];
  const parts = sections
    .filter(([, rows]) => Array.isArray(rows) && rows.length)
    .map(([title, rows]) => `${title}\n${toCsv(rows)}`);

  const profile = data.profile || {};
  const header = [
    `Levli data export`,
    `App version,${cell(APP_VERSION)}`,
    `Exported at,${cell(new Date().toISOString())}`,
    `Account,${cell(data.email || "")}`,
    ``,
    `Profile`,
    toCsv([{
      first_name: profile.first_name || "", birthdate: profile.birthdate,
      height_cm: profile.height_cm, weight_unit: profile.weight_unit,
      goal_weight_kg: profile.goal_weight_kg, default_medication: plainBrandName(profile.default_medication),
      days_between: profile.days_between, plan_type: profile.plan_type,
    }]),
  ].join("\n");

  return [header, ...parts].join("\n\n");
}

/** Triggers a download of the given text as a file. */
export function downloadTextFile(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}