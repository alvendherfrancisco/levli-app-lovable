import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Gives the signed-in user a unique username once (backend-user-schema.md §3).
// Idempotent: returns the existing username when one is already set.
const ADJ = ["Happy","Clever","Swift","Brave","Bright","Calm","Cool","Daring","Eager","Fair",
  "Gentle","Grand","Jolly","Kind","Lively","Merry","Noble","Proud","Quick","Silent"];
const NOUN = ["Panda","Tiger","Eagle","Wolf","Bear","Lion","Hawk","Fox","Deer","Owl",
  "Raven","Falcon","Shark","Dolphin","Phoenix","Dragon","Unicorn","Griffin","Lynx","Otter"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const usernameOf = (u) => u?.username ?? u?.data?.username ?? "";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (usernameOf(me)) return Response.json({ username: usernameOf(me), created: false });

    const admin = base44.asServiceRole;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `${pick(ADJ)}${pick(NOUN)}${Math.floor(Math.random() * 1000)}`;
      const lc = candidate.toLowerCase();
      const clash = await admin.entities.User.filter({ username_lc: lc });
      if (clash.length) continue;
      await admin.entities.User.update(me.id, { username: candidate, username_lc: lc });
      // Re-read to defend against a concurrent writer that won the race.
      const fresh = await admin.entities.User.get(me.id);
      const freshLc = fresh?.username_lc ?? fresh?.data?.username_lc;
      if (freshLc === lc) return Response.json({ username: candidate, created: true });
      if (usernameOf(fresh)) return Response.json({ username: usernameOf(fresh), created: false });
    }
    return Response.json({ error: "username_generation_failed" }, { status: 500 });
  } catch (error) {
    console.error("ensureProfile failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}