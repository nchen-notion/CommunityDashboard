export const dynamic = "force-dynamic";

import { isAdminAuthed, unauthorized } from "@/lib/admin";

const GH_TOKEN = process.env.GH_PAT ?? "";
const REPO = "nchen-notion/CommunityDashboard";
const WORKFLOW = "monthly-snapshot.yml";

export async function POST(): Promise<Response> {
  if (!isAdminAuthed()) return unauthorized();
  if (!GH_TOKEN) {
    return Response.json(
      { ok: false, message: "GH_PAT not configured" },
      { status: 500 },
    );
  }

  // Check if a scrape is already running before dispatching a new one
  const runsRes = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (runsRes.ok) {
    const data = (await runsRes.json()) as {
      workflow_runs?: Array<{ status: string }>;
    };
    const latest = data.workflow_runs?.[0];
    if (latest && (latest.status === "queued" || latest.status === "in_progress")) {
      return Response.json(
        { ok: false, message: "A scrape is already running" },
        { status: 409 },
      );
    }
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return Response.json(
      { ok: false, message: `GitHub API error: ${res.status} — ${text}` },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, message: "Scrape started via GitHub Actions" });
}
