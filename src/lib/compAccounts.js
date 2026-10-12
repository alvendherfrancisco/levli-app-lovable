// ─────────────────────────────────────────────────────────────────────────────
// Complimentary accounts.
//
// Accounts listed here get full premium access permanently, with no payment and
// no subscription on their profile. The check is made on the signed-in email
// address (see src/lib/SubscriptionContext.jsx), so it holds whatever the
// profile says and does not depend on a profile having loaded.
//
// Addresses are compared case-insensitively and with surrounding spaces ignored,
// so a differently-cased sign-in still matches.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPED_EMAILS = [
  "amermujkan@gmail.com",
  "alvendherfrancisco@gmail.com",
  "mujkanovic.amer@gmail.com",
];

const COMPED = new Set(COMPED_EMAILS.map((email) => email.trim().toLowerCase()));

/** true when this address has permanent complimentary premium access. */
export function isCompedEmail(email) {
  if (!email) return false;
  return COMPED.has(String(email).trim().toLowerCase());
}