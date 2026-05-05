export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { revalidatePath, revalidateTag } from "next/cache";
import { fetchLiveSnapshot, writeSnapshot } from "@/lib/notion";
import { isAdminAuthed, unauthorized } from "@/lib/admin";

export async function POST(req: Request): Promise<Response> {
  if (!isAdminAuthed()) return unauthorized();
  try {
    const body = await req.json().catch(() => ({}));
    const month = typeof body?.month === "string" && /^\d{4}-\d{2}$/.test(body.month)
      ? body.month
      : undefined;
    const snap = await fetchLiveSnapshot();
    await writeSnapshot(snap, month);
    revalidateTag("dashboard-data");
    revalidatePath("/", "layout");
    return Response.json({ ok: true, month });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, message }, { status: 500 });
  }
}
