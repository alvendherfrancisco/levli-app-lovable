export default async function(req: Request): Promise<Response> {
  return Response.json({ ok: true, probe: "v1/apple-auth-webhook" });
}