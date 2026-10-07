// ─────────────────────────────────────────────────────────────────────────────
// The onboarding answers, held on the device until the account that owns them
// exists.
//
// Onboarding is answered before anyone is signed in, and the account step can
// leave the page altogether (Google and Apple send the person away and bring
// them back). So every answer is written here as it is given — in localStorage,
// because it has to survive both a reload and the trip out to a provider — and
// the whole set is saved to the profile in one write when onboarding finishes.
//
// Nothing here is an account. It is one device's unfinished setup, and it is
// cleared the moment the answers have been saved to their own profile.
// ─────────────────────────────────────────────────────────────────────────────

const DRAFT_KEY = "levli_onboarding_draft";
const REDIRECT_KEY = "levli_onboarding_redirect";

export function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data || {}));
  } catch (e) { /* storage unavailable — onboarding still works in this tab */ }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) { /* ignore */ }
}

/** Records that a provider sign-in is leaving the page, so the return trip can
    tell a sign-in that came back from one that was cancelled. */
export function markProviderRedirect() {
  try {
    localStorage.setItem(REDIRECT_KEY, "1");
  } catch (e) { /* ignore */ }
}

/**
 * Reads and clears that marker. true means this page load is the return from a
 * provider — whether it succeeded or not, which the caller tells apart by
 * whether a session came back with it.
 */
export function takeProviderRedirect() {
  let pending = false;
  try {
    pending = localStorage.getItem(REDIRECT_KEY) === "1";
    localStorage.removeItem(REDIRECT_KEY);
  } catch (e) {
    pending = false;
  }
  return pending;
}

/** The first name from a signed-in account, or "" when the provider gave none. */
export function firstNameFromUser(user) {
  const full = String(user?.full_name || "").trim();
  if (!full) return "";
  return full.split(/\s+/)[0];
}