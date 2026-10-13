# Backend User Schema (Base44)

A standalone guide for the minimal user layer every iOS-wrapper web app needs
on Base44. It covers only the user-facing profile fields and the function that
guarantees they exist; no game, leaderboard, subscription or social entities
are included.

Translation table from the Supabase original: `base44-backend-mapping.md` §1.

---

## 1. Why you need a profile layer

Base44 manages the built-in **`User` entity** for you: `id`, `email`,
`full_name`, `role`, `created_date`, plus any **custom fields** you add to the
User schema (exposed as `user.data.*` and usable in RLS rules as
`{{user.data.*}}`). You cannot change the built-in fields and you should not
treat `email` as a display name.

The canonical pattern is:

- Built-in User fields store **identity**: email, role, provider-side name.
- Custom User fields store **user-facing metadata**: `username`, `avatar`,
  `preferred_language`, or any other per-user field your app needs.

Every web app in the wrapper must (a) add `username` as a required-unique
custom User field and (b) guarantee it is populated before any screen reads
it. Base44 has no database triggers on user creation, so (b) is done by a
backend function the web calls once.

---

## 2. Required schema

### Custom fields on `User`

`base44/entities/User.jsonc` (or the dashboard's **User schema** editor):

```jsonc
{
  "name": "User",
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 24,
      "description": "Public display handle. Unique per app. Generated server-side."
    },
    "username_lc": {
      "type": "string",
      "description": "Lower-cased copy of username for case-insensitive uniqueness checks."
    },
    "bonus_credits": {
      "type": "integer",
      "default": 0,
      "description": "Reward balance written only by backend functions (referral credit etc.)."
    }
    // add display_name, avatar_url, preferred_language … as needed
  },
  "rls": {
    "read":   { "id": "{{user.id}}" },
    "update": false,
    "create": false,
    "delete": false
  }
}
```

Rules:

- **Users never write their own profile fields from the client.** All writes
  go through backend functions using `asServiceRole` (username generation,
  reward balances, admin edits). If you later want user-editable fields
  (avatar, display name), expose a dedicated `update-profile` function that
  validates and writes them — do not open `update` RLS on `User`.
- Uniqueness is **not** enforced by the store. The `ensure-profile` function
  enforces it with a filter-then-write loop (§3). Keep `username_lc` so the
  check is case-insensitive.
- Keep the profile strictly user-only. Scores, progress, purchases,
  memberships live in their own entities and reference the user by
  `user_id` (= `User.id`) or `created_by` (= email).

---

## 3. `ensure-profile` backend function

`base44/functions/ensure-profile/entry.ts` — called by the web **once per
session** after `base44.auth.me()` resolves and `me.data?.username` is empty.
Idempotent: returns the existing username if one is set.

```ts
import { createClientFromRequest } from "npm:@base44/sdk";

const ADJ  = ["Happy","Clever","Swift","Brave","Bright","Calm","Cool","Daring",
              "Eager","Fair","Gentle","Grand","Jolly","Kind","Lively","Merry",
              "Noble","Proud","Quick","Silent"];
const NOUN = ["Panda","Tiger","Eagle","Wolf","Bear","Lion","Hawk","Fox","Deer",
              "Owl","Raven","Falcon","Shark","Dolphin","Phoenix","Dragon",
              "Unicorn","Griffin","Lynx","Otter"];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const me = await base44.auth.me();                       // null for external callers
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.data?.username) return Response.json({ username: me.data.username, created: false });

  const admin = base44.asServiceRole;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `${pick(ADJ)}${pick(NOUN)}${Math.floor(Math.random() * 1000)}`;
    const lc = candidate.toLowerCase();
    const clash = await admin.entities.User.filter({ username_lc: lc }, undefined, 1);
    if (clash.length) continue;
    await admin.entities.User.update(me.id, { username: candidate, username_lc: lc });
    // Re-read to defend against a concurrent writer that won the race.
    const fresh = await admin.entities.User.get(me.id);
    if (fresh.data?.username_lc === lc) return Response.json({ username: candidate, created: true });
  }
  return Response.json({ error: "username_generation_failed" }, { status: 500 });
}
```

> **Why a function, not a trigger.** Base44 users are created by the platform
> when the embed sign-in token is redeemed (see
> `session-injection-contract.md`), and entity automations are not documented
> for the built-in `User` entity. A single idempotent function called from the
> session bridge guarantees every user gets a profile regardless of entry
> point — the same invariant the Supabase trigger provided.

---

## 4. How it fits into the auth flow

```text
iOS wrapper                              Vapor                          Base44
-----------                              -----                          ------
User taps Apple Sign In  ──────────►
Native sign-in completes
POST identity token ────────────────►  verify w/ Apple JWKS
                                       users[apple_user_id] ⇐ email
                                       POST /api/apps/{{BASE44_APP_ID}}/users/provisions
                                       POST /api/apps/{{BASE44_APP_ID}}/embed-tokens   ─────►  { token, embed_url }
◄──────── { user: { email }, auth: { ott, embed_url, expires_in } }
window.setBase44Session(ott, email)
                                                              Web redeems ott → access token
                                                              base44.auth.me()  → { id, email, data: {} }
                                                              functions.invoke("ensure-profile") → { username }
```

The same flow applies to Google Sign In — Vapor verifies the Google token and
calls the same two Apps API endpoints.

---

## 5. Reading the profile from the web app

After `window.setBase44Session` has completed, `base44.auth.me()` returns the
user including custom fields:

```tsx
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuthReady } from "@/hooks/useAuthReady";

export function useProfile() {
  const { user, authEpoch } = useAuthReady();
  const [profile, setProfile] = useState<null | { id: string; email: string; username: string }>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      let me = await base44.auth.me();
      if (!me?.data?.username) {
        await base44.functions.invoke("ensure-profile", {});
        me = await base44.auth.me();
      }
      if (!cancelled && me) setProfile({ id: me.id, email: me.email, username: me.data?.username ?? "" });
    })();
    return () => { cancelled = true; };
  }, [user?.id, authEpoch]);

  return profile;
}
```

> Always derive the trusted user id from `base44.auth.me()` (server round
> trip), not from a cached object — the cached object can be stale right after
> the wrapper injects a new session.

---

## 6. Validation checklist

Before you ship the app:

- [ ] `User` schema has `username`, `username_lc` (and any other profile
      fields) with `read: {id: {{user.id}}}` and all client writes closed.
- [ ] `ensure-profile` exists, is idempotent, and is called from the session
      bridge after the first successful `auth.me()`.
- [ ] A test user created via the Apple **and** the Google path ends up with a
      unique username.
- [ ] Two concurrent `ensure-profile` calls for the same user produce one
      username (the re-read guard).
- [ ] Deleting the user (`delete-user-prompt.md`) removes every entity record
      keyed by `user_id` / `created_by` and then deprovisions the app user.

---

## 7. What not to add to this schema

Keep the profile strictly user-only. Any data that belongs to a specific
feature, workflow or record type — progress, purchases, scores, membership
lists — should live in its own entity and reference the user by
`user_id`. This separation keeps the user layer simple and reusable across
every app that uses the iOS wrapper.
