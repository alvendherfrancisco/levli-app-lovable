import { isAuthorized, signIn } from "../../../shared/vaporAuth.ts";

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
    if (!isAuthorized(req)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { apple_user_id, email, full_name } = await req.json();
    if (!apple_user_id || !email) {
      return Response.json({ success: false, error: "apple_user_id and email are required" }, { status: 400 });
    }
    const name = [full_name?.first_name, full_name?.last_name].filter(Boolean).join(" ").trim();
    return Response.json(await signIn(email, name, apple_user_id));
  } catch (error) {
    console.error("apple-auth-webhook failed:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}