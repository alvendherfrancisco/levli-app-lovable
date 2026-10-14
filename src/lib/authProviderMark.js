// Remembers which provider (apple / google) the current sign-in started with,
// so the Vapor handoff can report it. Stored in localStorage because the web
// OAuth flow leaves the page; expires after 15 minutes and is read once.
const KEY = "levliAuthProvider";
const MAX_AGE_MS = 15 * 60 * 1000;

export const markAuthProvider = (provider) => {
  localStorage.setItem(KEY, JSON.stringify({ provider, at: Date.now() }));
};

export const takeAuthProvider = () => {
  const raw = localStorage.getItem(KEY);
  localStorage.removeItem(KEY);
  const mark = raw ? JSON.parse(raw) : null;
  if (!mark || Date.now() - mark.at > MAX_AGE_MS) return null;
  return mark.provider === "apple" || mark.provider === "google" ? mark.provider : null;
};