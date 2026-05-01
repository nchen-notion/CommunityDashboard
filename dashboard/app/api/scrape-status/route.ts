import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const STATUS_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "scrape-status.json",
);

type ScrapeStatus =
  | { running: true; started_at: string }
  | { running: false; completed_at: string | null };

export function GET(): Response {
  if (!fs.existsSync(STATUS_FILE)) {
    return Response.json({ running: false, completed_at: null } satisfies ScrapeStatus);
  }

  const status = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8")) as ScrapeStatus;

  // Treat as timed-out if it's been stuck as "running" for > 45 min
  if (status.running) {
    const elapsed = Date.now() - new Date(status.started_at).getTime();
    if (elapsed > 45 * 60 * 1000) {
      return Response.json({ running: false, completed_at: null } satisfies ScrapeStatus);
    }
  }

  return Response.json(status);
}
