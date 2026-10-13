# Deep Link Payload Contract (data-driven `navigateFromIOS`) — OPTIONAL EXTENSION

> **Status: optional.** The canonical contract in this doc set is the
> path-only form `window.navigateFromIOS(path)` (guide §3.5,
> `notification-tap-handling.md`). Adopt this extension only if your app has
> several shareable feature types and you want to add new ones without a
> wrapper release. If you adopt it, it **supersedes** the path-only form for
> Tapp / Universal-Link arrivals (a plain path string stays accepted for
> back-compat, §5) and the wrapper must pass the dictionary instead of
> constructing `"/join-leaderboard/<id>"` (§6). Notification taps keep calling
> `navigateFromIOS(path)` + the `notificationTapped` CustomEvent as specified
> in `notification-tap-handling.md`; the `navigateFromIOSAfterNotification`
> entry point mentioned below is one source project's variant and is **not**
> required.

**Rule: the iOS wrapper never builds app paths.** It forwards a key/value
dictionary and the web app decides what to open. Adding a new shareable
feature is therefore a web-only change — no wrapper release required.

> **Two entry points, one registry.** Tapp links and Universal Links call
> `window.navigateFromIOS(payload | path)`. Notification taps (local + APNs)
> call `window.navigateFromIOSAfterNotification(payload)`, which additionally
> emits the `wanillajs.event.notificationTapped` analytics event. Both funnel
> into `resolveDeepLinkTarget` and the same session gate — see
> [`notification-tap-handling.md`](./notification-tap-handling.md).

---

## 1. The round trip

```text
Web  ──ce wanillajs.event.share.requestLink { featureType, featureValue, object, source, userID, deeplink }
     │
iOS  ──> mints a Tapp link, embedding that dictionary as link metadata
     │
     ── handleShareLinkFromIOS({ shareLink, ... })  ← link returned to the web for sharing
     │
 …later, a recipient opens the link (deferred or direct) …
     │
iOS  ──> resolves the link natively, reads back the SAME dictionary
     ──> window.navigateFromIOS(<dictionary>)
     │
Web  ──> resolveDeepLinkTarget(payload) → route → React Router navigate()
```

The dictionary that comes back is the dictionary the web app sent. Symmetry is
the whole point: iOS is a transport, not a router.

## 2. Payload keys

| Key | Required | Meaning |
|---|---|---|
| `featureType` | yes | Selects the web-side handler, e.g. `leaderboard_invite`, `referral_credit`. |
| `featureValue` | usually | The primary identifier for that feature (board id, challenge id, award amount). |
| `object` | optional | Human/secondary identifier; used as a fallback for `featureValue`. |
| `source` | optional | Where the link was created (`leaderboard_detail`, `settings`) — analytics only. |
| `userID` | optional | The sharer's user id (attribution / crediting). |
| `deeplink` | optional | An explicit in-app path (e.g. `/join/<inviteCode>`). Preferred when present. |

Accepted variants (normalized on the web side): `userId` / `user_id`,
`feature_type`, `feature_value`, `deepLink`, `path`. A JSON **string** of the
dictionary is also accepted, as is a bare path string (back-compat, §5).

## 3. Web-side registry

`src/utils/iosDeepLinkPayload.ts` is the single source of truth:

- `IOSDeepLinkPayload` — the type.
- `normalizeDeepLinkPayload(input)` — string | JSON string | object → payload.
- `resolveDeepLinkTarget(payload)` — payload → route path, or `null`.

Current mapping:

| `featureType` | Destination |
|---|---|
| `leaderboard_invite` | `deeplink` (`/join/<code>`) if present, else `/join-leaderboard/<featureValue>` |
| `challenge_invite` | `/challenge/<featureValue>`, else `deeplink` |
| `referral_credit` | `deeplink` if present, else `/` (credit is applied server-side) |
| anything else | `deeplink` if present, otherwise ignored with a dev warning |

**Never throw and never 404 on an unknown type.** Old links must keep opening
the app even after a feature is retired.

### Adding a feature type

1. Send the new `featureType` in `requestShareLink(...)` where the link is created.
2. Add one `case` to `resolveDeepLinkTarget`.
3. Make sure the destination route exists, and add its prefix to
   `PUBLIC_IOS_PATHS` only if it must work before sign-in.

No wrapper change. No Swift change.

## 4. Session gate and cold start

`IOSNavigationBridge` resolves the payload first, then applies the existing
gate: for any route outside `PUBLIC_IOS_PATHS` it checks the
web-side `authStore`. With no user it stashes the payload in
`window.__pendingIOSDeepLink` (plus the resolved path in
`window.__pendingIOSPath` for legacy readers) and emits
`wanillajs.event.auth.sessionRequested` with `{ reason: "iosNavigation", path, featureType }`.
Once `window.setBase44Session` lands, the pending payload is replayed.

If iOS calls before the bridge has mounted (cold start), it assigns
`window.__pendingIOSDeepLink` instead; the bridge drains it on mount.

## 5. Back-compat

- `window.navigateFromIOS("/join-leaderboard/<id>")` — a plain path string is
  still accepted and navigated verbatim.
- `window.__pendingIOSPath` is still read on mount.
- `window.joinLeaderboardById(id)` (legacy wrapper builds) now routes its
  success through the same payload entry point.

Older wrapper builds keep working while the new build rolls out.

## 6. Swift side

```swift
/// Forward a deep-link dictionary to the web app. iOS does not interpret it.
func navigateFromIOS(payload: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: payload),
          let json = String(data: data, encoding: .utf8) else { return }
    let script = """
    (function() {
        var p = \(json);
        if (typeof window.navigateFromIOS === 'function') {
            window.navigateFromIOS(p);
        } else {
            window.__pendingIOSDeepLink = p;
        }
    })();
    """
    evaluateJavaScript(script)
}

/// Back-compat overload for push taps / Universal Links that already carry a path.
func navigateFromIOS(path: String) {
    navigateFromIOS(payload: ["deeplink": path])
}
```

On a Tapp resolution, pass the resolved link metadata straight through — do
**not** construct `"/join-leaderboard/\(id)"` any more.

## 7. Verification checklist

- [ ] Tapp link for a board invite opens the board (payload with
      `featureType: "leaderboard_invite"` and a `/join/<code>` deeplink).
- [ ] Same payload with `deeplink` removed still resolves via `featureValue`.
- [ ] Unknown `featureType` with no `deeplink` → app opens normally, no crash,
      dev warning logged.
- [ ] Payload arriving with no session → `auth.sessionRequested` emitted, and
      the destination opens once the session is injected.
- [ ] Payload arriving before mount (cold start) is drained via
      `window.__pendingIOSDeepLink`.
- [ ] Legacy plain-path call still navigates.
- [ ] Navigation is SPA-only — no full document reload.
