// ─────────────────────────────────────────────────────────────────────────────
// Complimentary full access.
//
// Accounts listed here have every premium feature unlocked for good — no
// payment, no active subscription and no billing details are involved. The
// check is made against the signed-in account's own email, so it holds whatever
// their subscription status happens to be, and it is the single place
// premium access is granted for free: every paywall in the app reads
// `isPremium` from the subscription context (see src/lib/SubscriptionContext.jsx),
// which consults this list first.
// ─────────────────────────────────────────────────────────────────────────────

const COMPED_EMAILS = [
  "alvendherfrancisco01@gmail.com",
  "sam.olsson@kurve.co.uk",
  "alex@wanilla.co",
  "amermujkan@gmail.com",
  "mujkanovic.amer@gmail.com",
];

/** Whether the signed-in account has complimentary full access. */
export function hasCompedAccess(email) {
  if (!email) return false;
  return COMPED_EMAILS.includes(String(email).trim().toLowerCase());
}