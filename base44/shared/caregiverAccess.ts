// The rules of caregiver access, in one place: how long an invite lives, how an
// address is read, what a person is called in the invite, and the reconciliation
// that turns a pending invite into an active share.
//
// Both backend functions that touch this flow import from here, so the invite and
// the records can never disagree about who is allowed in. The important rules are
// all on this side of the wire: only an ACTIVE row grants anything, an invite that
// ran out its week is closed rather than accepted, and a row is only ever matched
// to the address it was sent to.

export const INVITE_DAYS = 7;

const SCOPE_LABELS = { read: "Read only", read_write: "Read & write" };

export const scopeLabel = (scope) => SCOPE_LABELS[scope] || "Read only";
export const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(value));
export const nowIso = () => new Date().toISOString();
export const inviteExpiry = () => new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();

/** A pending invite that has run out its week. */
export function isExpired(row) {
  const until = Date.parse(row?.expires_at || "");
  return Number.isFinite(until) && until < Date.now();
}

/** The rows behind an entity read, whichever shape the client returns — an array
 *  of records, or one page of them. */
export const entityRows = (result) => (Array.isArray(result) ? result : (result?.items || []));

/** A person's name as it should read to somebody else: their first name from the
 *  app's own profile, else the name on their account, else the name the invite
 *  was saved under, else the part before the @ in their address. */
export function personName({ profile, user, fallback } = {}) {
  const first = String(profile?.first_name || "").trim();
  if (first) return first;
  const full = String(user?.full_name || "").trim();
  if (full && !full.includes("@")) {
    const word = full.replace(/[._-]+/g, " ").split(" ").filter(Boolean)[0];
    if (word) return word.charAt(0).toUpperCase() + word.slice(1);
  }
  const saved = String(fallback || "").trim();
  if (saved && !saved.includes("@")) return saved;
  const email = String(user?.email || saved || "").trim();
  return email.includes("@") ? email.split("@")[0] : "Your contact";
}

/** The name an invite speaks in — the same name the shared list shows. */
export async function ownerFirstName(admin, ownerId, owner) {
  let profile = null;
  try {
    const rows = entityRows(await admin.entities.UserProfile.filter({ created_by_id: ownerId }));
    profile = rows.find((row) => String(row?.first_name || "").trim()) || rows[0] || null;
  } catch (error) {
    console.error("Could not read the profile name", error);
  }
  return personName({ profile, user: owner });
}

/** The profile row to read for each owner — the newest one they have. */
export function newestProfileByOwner(rows = []) {
  const map = new Map();
  entityRows(rows).forEach((row) => {
    const current = map.get(row.created_by_id);
    if (!current || String(row.updated_date || "") > String(current.updated_date || "")) {
      map.set(row.created_by_id, row);
    }
  });
  return map;
}

/** The shares that are live for this account: active, not their own, and either
 *  linked to their user id or addressed to their exact email. */
export async function activeSharesFor(admin, me) {
  const [linked, addressed] = await Promise.all([
    admin.entities.ProxyAccess.filter({ grantee_user_id: me.id }),
    admin.entities.ProxyAccess.filter({ grantee_email: normalizeEmail(me.email) }),
  ]);
  const seen = new Set();
  return entityRows(linked)
    .concat(entityRows(addressed))
    .filter((row) => {
      if (!row?.id || seen.has(row.id)) return false;
      seen.add(row.id);
      return row.status === "active" && row.created_by_id && row.created_by_id !== me.id;
    })
    .sort((a, b) => String(b.granted_date || "").localeCompare(String(a.granted_date || "")));
}

/** Links the invites addressed to this account, so no code is ever needed: a
 *  pending invite that is still inside its week becomes active on the first
 *  sign-in with that address, and one that has run out is closed. Runs on every
 *  load of the shared list, so it is idempotent and cheap after the first time. */
export async function claimPendingInvites(admin, me) {
  const rows = entityRows(await admin.entities.ProxyAccess.filter({ grantee_email: normalizeEmail(me.email) }));
  const toActivate = [];
  const toClose = [];
  rows.forEach((row) => {
    // An invite the person sent themselves grants nothing.
    if (!row?.id || row.created_by_id === me.id) return;
    if (row.status === "active") {
      if (!row.grantee_user_id) {
        toActivate.push({ id: row.id, grantee_user_id: me.id, granted_date: row.granted_date || nowIso() });
      }
      return;
    }
    if (row.status !== "pending") return;
    if (isExpired(row)) toClose.push({ id: row.id, status: "expired" });
    else toActivate.push({ id: row.id, status: "active", grantee_user_id: me.id, granted_date: nowIso() });
  });
  if (toActivate.length) await admin.entities.ProxyAccess.bulkUpdate(toActivate);
  if (toClose.length) await admin.entities.ProxyAccess.bulkUpdate(toClose);
  return { activated: toActivate.length, expired: toClose.length };
}