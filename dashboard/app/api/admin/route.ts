export const dynamic = "force-dynamic";

import { isAdminAuthed } from "@/lib/admin";

export async function GET(): Promise<Response> {
  return Response.json({ authed: isAdminAuthed() });
}
