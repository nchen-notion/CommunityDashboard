import fs from "fs";
import { spawn } from "child_process";
import path from "path";

const STATUS_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "scrape-status.json",
);

export async function POST(): Promise<Response> {
  // Prevent double-runs
  if (fs.existsSync(STATUS_FILE)) {
    const existing = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
    if (existing.running) {
      return Response.json(
        { ok: false, message: "Scrape already running" },
        { status: 409 },
      );
    }
  }

  fs.writeFileSync(
    STATUS_FILE,
    JSON.stringify({ running: true, started_at: new Date().toISOString() }),
  );

  // Spawn the runner script detached — it sequences enricher → snapshot → marks done.
  const runner = path.join(process.cwd(), "scripts", "run-scrape.js");
  const child = spawn("node", [runner], { detached: true, stdio: "ignore" });
  child.unref();

  return Response.json({ ok: true, message: "Scrape started" });
}
