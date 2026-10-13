import { isAuthorized, signIn } from "../../../shared/vaporAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    if (!isAuthorized(req)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { google_user_id, email, full_name } = await req.json();
    if (!google_user_id || !email) {
      return Response.json({ success: false, error: "google_user_id and email are required" }, { status: 400 });
    }
    const name = typeof full_name === "string"
      ? full_name.trim()
      : [full_name?.first_name, full_name?.last_name].filter(Boolean).join(" ").trim();
    return Response.json(await signIn(email, name, google_user_id));
  } catch (error) {
    console.error("google-auth-webhook failed:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}