import { secrets } from "base44:runtime";

const API = "https://app.base44.com/api/apps";

const safeEqual = (a: string, b: string) => {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
};

/** Vapor calls every v1 endpoint with x-api-key = APPLE_WEBHOOK_API_KEY. */
export function isAuthorized(req: Request) {
  const key = secrets.get("APPLE_WEBHOOK_API_KEY") || "";
  const given = req.headers.get("x-api-key") || "";
  return !!key && !!given && safeEqual(given, key);
}

async function appsApi(path: string, body: unknown) {
  const res = await fetch(`${API}/${secrets.get("BASE44_APP_ID")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", api_key: secrets.get("APPLE_WEBHOOK_API_KEY") },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

/** Provisions the user (if new) and mints a one-time sign-in token, in Vapor's response shape. */
export async function signIn(email: string, name: string, providerUserId: string) {
  const provisioned = await appsApi("/users/provisions", { email, role: "user", ...(name ? { full_name: name } : {}) });
  const minted = await appsApi("/embed-url", { email, target: "live_site" });
  const u = provisioned.user || provisioned;
  return {
    success: true,
    user: { id: String(u.id || providerUserId), email: u.email || email, created_at: u.created_date || new Date().toISOString() },
    auth: {
      access_token: minted.token,
      refresh_token: minted.token,
      expires_in: minted.expires_in || 60,
      token_type: "bearer",
      embed_url: minted.embed_url,
    },
    is_new_user: provisioned.created === true,
  };
}