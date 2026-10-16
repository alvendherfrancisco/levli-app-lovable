/**
 * The Home shortcut to the records other people have shared with this account,
 * put away by the person it is shown to.
 *
 * Hiding the shortcut is a choice about this device's screen — the same kind of
 * choice as the long-gap reminder (src/lib/longGapReminder.js) — so it is kept
 * beside the other device choices and never leaves the phone. It hides the row
 * and nothing else: the access itself is untouched, and the More screen keeps a
 * permanent way back to it.
 *
 * One entry per share holds the share that was put away. A share nobody has
 * dismissed — someone sharing their records for the first time — is therefore
 * shown again, while the ones already dealt with stay quiet.
 */
const KEY = "levli:sharedWithMeHidden";

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch { return []; }
};

const write = (ids) => {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode: it simply shows */ }
};

/** The shares still worth a Home shortcut: the ones not put away on this device. */
export function undismissedShares(shares) {
  const hidden = new Set(read());
  return (shares || []).filter((share) => share?.id && !hidden.has(String(share.id)));
}

/** Puts one share's Home shortcut away. Access to those records is unchanged. */
export function dismissSharedShortcut(id) {
  if (!id) return;
  const key = String(id);
  const ids = read();
  if (!ids.includes(key)) write([...ids, key]);
}