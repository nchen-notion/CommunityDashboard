export const dynamic = "force-dynamic";

import { ADMIN_COOKIE, adminPassword } from "@/lib/admin";

export async function POST(req: Request): Promise<Response> {
  const expected = adminPassword();
  if (!expected) {
    return Response.json(
      { ok: false, message: "ADMIN_PASSWORD not configured" },
      { status: 500 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";
  if (password !== expected) {
    return Response.json({ ok: false, message: "Incorrect password" }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(expected)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 8}`,
  );
  return res;
}
