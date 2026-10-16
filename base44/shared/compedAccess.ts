// ─────────────────────────────────────────────────────────────────────────────
// Complimentary full access — the server-side list.
//
// Accounts listed here have every premium feature unlocked for good: no payment,
// no active subscription and no billing details are involved. It is read by both
// backend functions that gate Premium on the server — the report export
// (base44/functions/report-export-gate) and the records a caregiver is shown
// (base44/functions/sharedRecords) — so an account unlocks the same way wherever
// the check happens to be made.
//
// The app's own screens keep their own copy for the signed-in account
// (src/lib/compedAccess.js); keep the two lists in step.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPED_EMAILS = [
  "alvendherfrancisco01@gmail.com",
  "sam.olsson@kurve.co.uk",
  "alex@wanilla.co",
  "amermujkan@gmail.com",
  "mujkanovic.amer@gmail.com",
];

/** Whether an account's email has complimentary full access. */
export function hasCompedAccess(email?: string | null): boolean {
  if (!email) return false;
  return COMPED_EMAILS.includes(String(email).trim().toLowerCase());
}