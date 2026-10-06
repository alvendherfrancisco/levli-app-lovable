/**
 * The last profile this device loaded, kept locally.
 *
 * The first screen has to know two things immediately: whether to open Home or
 * onboarding, and which units to show. Both live on the profile, so asking the
 * server for them makes the first screen wait on a round-trip (and the launch
 * splash with it). The cached copy answers straight away; the fresh one replaces
 * it a moment later, and nothing else reads this cache.
 *
 * It is the account holder's own data on their own device — the same place the
 * session token already lives — and it is cleared the moment they sign out.
 */

const KEY = "levli:profile";

export function readCachedProfile() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedProfile(profile) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* nothing to keep */
  }
}

export function clearCachedProfile() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}