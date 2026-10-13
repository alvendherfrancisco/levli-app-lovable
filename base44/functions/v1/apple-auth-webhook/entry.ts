import { secrets } from "base44:runtime";

const API = "https://app.base44.com/api/apps";

async function appsApi(path, key, body) {
  const res = await fetch(`${API}/${secrets.get("BASE44_APP_ID")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", api_key: key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    if (req.headers.get("x-api-key") !== secrets.get("APPLE_WEBHOOK_API_KEY")) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { apple_user_id, email, full_name } = await req.json();
    if (!apple_user_id || !email) {
      return Response.json({ success: false, error: "apple_user_id and email are required" }, { status: 400 });
    }
    const key = secrets.get("BASE44_WORKSPACE_API_KEY");
    if (!key) {
      console.error("BASE44_WORKSPACE_API_KEY is not set");
      return Response.json({ success: false, error: "Sign-in not configured" }, { status: 503 });
    }
    const name = [full_name?.first_name, full_name?.last_name].filter(Boolean).join(" ").trim();

    const provisioned = await appsApi("/users/provisions", key, { email, role: "user", ...(name ? { full_name: name } : {}) });
    let minted;
    try {
      minted = await appsApi("/embed-tokens", key, { email, surface: "live_site" });
    } catch (_e) {
      minted = await appsApi("/embed-url", key, { email, surface: "live_site" });
    }

    const u = provisioned.user || provisioned;
    return Response.json({
      success: true,
      user: { id: String(u.id || apple_user_id), email: u.email || email, created_at: u.created_date || new Date().toISOString() },
      auth: {
        access_token: minted.token,
        refresh_token: minted.token,
        expires_in: minted.expires_in || 60,
        token_type: "bearer",
        embed_url: minted.embed_url,
      },
      is_new_user: provisioned.created === true,
    });
  } catch (error) {
    console.error("apple-auth-webhook failed:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}