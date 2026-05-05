export const dynamic = "force-dynamic";

import { revalidateTag } from "next/cache";

export async function POST(): Promise<Response> {
  revalidateTag("dashboard-data");
  return Response.json({ ok: true });
}

export async function GET(): Promise<Response> {
  revalidateTag("dashboard-data");
  return Response.json({ ok: true });
}
