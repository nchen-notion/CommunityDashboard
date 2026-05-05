export const dynamic = "force-dynamic";

import { revalidateTag } from "next/cache";
import { isAdminAuthed, unauthorized } from "@/lib/admin";

export async function POST(): Promise<Response> {
  if (!isAdminAuthed()) return unauthorized();
  revalidateTag("dashboard-data");
  return Response.json({ ok: true });
}

export async function GET(): Promise<Response> {
  if (!isAdminAuthed()) return unauthorized();
  revalidateTag("dashboard-data");
  return Response.json({ ok: true });
}
