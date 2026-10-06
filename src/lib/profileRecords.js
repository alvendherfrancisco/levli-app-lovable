// A person should have exactly one UserProfile record. Older sign-ups ended up
// with several (two saves ran before the first one had registered), and the app
// used to read whichever the database returned first — so it could land on the
// "onboarding not completed" copy and send a signed-in person back to onboarding.
//
// resolveProfileRecords picks the one record to keep (the completed one, else the
// most recently updated), and works out which values the others hold that the
// kept one is missing, so nothing the person entered is lost when the extras go.

const BUILT_IN = new Set([
  "id", "created_date", "updated_date", "created_by", "created_by_id", "is_sample", "app_id", "entity_name",
  // Left over from the removed push-reminder feature; no longer part of the profile.
  "notifications_enabled",
]);

const isEmpty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

export function resolveProfileRecords(rows = []) {
  if (!rows.length) return { keeper: null, patch: {}, extras: [] };

  const byRecent = [...rows].sort((a, b) => String(b.updated_date || "").localeCompare(String(a.updated_date || "")));
  const keeper = byRecent.find((r) => r.onboarding_completed === true) || byRecent[0];
  const extras = byRecent.filter((r) => r.id !== keeper.id);

  const patch = {};
  extras.forEach((other) => {
    Object.entries(other).forEach(([key, value]) => {
      if (BUILT_IN.has(key) || isEmpty(value)) return;
      if (isEmpty(keeper[key]) && isEmpty(patch[key])) patch[key] = value;
    });
  });

  return { keeper, patch, extras };
}