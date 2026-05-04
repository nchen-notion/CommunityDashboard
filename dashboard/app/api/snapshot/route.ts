export const dynamic = "force-dynamic";

import { fetchLiveSnapshot, writeSnapshot } from "@/lib/notion";

export async function POST(): Promise<Response> {
  try {
    const snap = await fetchLiveSnapshot();
    await writeSnapshot(snap);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, message }, { status: 500 });
  }
}
