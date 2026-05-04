export const dynamic = "force-dynamic";

const GH_TOKEN = process.env.GH_PAT ?? "";
const REPO = "nchen-notion/CommunityDashboard";
const WORKFLOW = "monthly-snapshot.yml";

export async function GET(): Promise<Response> {
  if (!GH_TOKEN) {
    return Response.json({ running: false, completed_at: null });
  }

  const res = await fetch(
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

  if (!res.ok) return Response.json({ running: false, completed_at: null });

  const data = await res.json() as { workflow_runs?: Array<{ status: string; conclusion: string | null; created_at: string; updated_at: string }> };
  const run = data.workflow_runs?.[0];

  if (!run) return Response.json({ running: false, completed_at: null });

  if (run.status === "queued" || run.status === "in_progress") {
    return Response.json({ running: true, started_at: run.created_at });
  }

  return Response.json({
    running: false,
    completed_at: run.updated_at,
    conclusion: run.conclusion,
  });
}
