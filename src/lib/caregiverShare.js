import { base44 } from "@/api/base44Client";
import { PUBLIC_BASE_URL } from "@/lib/appInfo";
import { formatLocaleDate, fromDayKey, parseShotDate } from "@/lib/dateUtils";

/**
 * The caregiver side of the app, on the client: the words a share is described
 * in, and the three calls that reach the backend — the invite, the list of people
 * who have shared with this account, and one person's records.
 *
 * Nothing here decides access. Every rule lives on the server (see
 * base44/shared/caregiverAccess.ts and the two functions beside it), and the list
 * and records calls only ever return what those rules allow.
 */

/** Keep in step with INVITE_DAYS in base44/shared/caregiverAccess.ts. */
export const INVITE_DAYS = 7;

const SCOPE_LABELS = { read: "Read only", read_write: "Read & write" };

export const SCOPE_OPTIONS = [
  { value: "read", label: SCOPE_LABELS.read },
  { value: "read_write", label: SCOPE_LABELS.read_write },
];

export const scopeLabel = (scope) => SCOPE_LABELS[scope] || SCOPE_LABELS.read;

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim().toLowerCase());

/** What an entry reads as on screen: pending, active, expired or revoked. */
export function accessStatus(access) {
  if (access?.status === "active") return "active";
  if (access?.status === "revoked") return "revoked";
  if (access?.status === "expired") return "expired";
  const until = Date.parse(access?.expires_at || "");
  return Number.isFinite(until) && until < Date.now() ? "expired" : "pending";
}

/** Grants access to one address. Nothing is sent from here: the invite is saved
 *  as pending and becomes active the first time that exact address signs in. */
export async function inviteCaregiver(payload) {
  const res = await base44.functions.invoke("inviteCaregiver", payload);
  return res?.data || {};
}

/** The words a person sends when they share an invite themselves. The address is
 *  the whole point of the message: access is matched to exactly that address. */
export const inviteMessage = (email) =>
  `I've shared my Levli records with you. Download the app and sign up with this email (${email}) to view them: ${PUBLIC_BASE_URL}`;

/** Opens the phone's own share sheet with that message, so it can go out through
 *  Messages, WhatsApp or anything else. Where there is no share sheet — the
 *  desktop preview, an older browser — the message is copied instead, ready to
 *  paste. Returns "shared", "cancelled", "copied" or "unavailable". */
export async function shareInvite(email) {
  const text = inviteMessage(email);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Levli", text });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled"; // put away, not a failure
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "unavailable";
  }
}

/** The people who have shared their records with this account. */
export async function listSharedWithMe() {
  const res = await base44.functions.invoke("sharedRecords", {});
  return res?.data?.shares || [];
}

/** One person's records, read only. */
export async function fetchSharedRecords(accessId) {
  const res = await base44.functions.invoke("sharedRecords", { accessId });
  return res?.data || {};
}

/** A stored day, in the device's own short form. Shot and journal entries keep
 *  "Jun 29, 2026", while the schema's date fields keep "2026-06-29"; both read
 *  the same way on screen. */
export function dayLabel(value) {
  const text = String(value || "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? fromDayKey(text) : parseShotDate(text);
  return formatLocaleDate(date) || text;
}