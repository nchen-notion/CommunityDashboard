export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { revalidatePath } from "next/cache";
import { fetchLiveSnapshot, writeSnapshot } from "@/lib/notion";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const month = typeof body?.month === "string" && /^\d{4}-\d{2}$/.test(body.month)
      ? body.month
      : undefined;
    const snap = await fetchLiveSnapshot();
    await writeSnapshot(snap, month);
    revalidatePath("/", "layout");
    return Response.json({ ok: true, month });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, message }, { status: 500 });
  }
}
