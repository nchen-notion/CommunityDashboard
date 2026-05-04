export const dynamic = "force-dynamic";

const GH_TOKEN = process.env.GH_PAT ?? "";
const REPO = "nchen-notion/CommunityDashboard";
const WORKFLOW = "monthly-snapshot.yml";

export async function POST(): Promise<Response> {
  if (!GH_TOKEN) {
    return Response.json(
      { ok: false, message: "GH_PAT not configured" },
      { status: 500 },
    );
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
