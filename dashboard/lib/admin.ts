import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function isAdminAuthed(): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const got = cookies().get(ADMIN_COOKIE)?.value;
  return !!got && got === expected;
}

export function unauthorized(): Response {
  return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
}
