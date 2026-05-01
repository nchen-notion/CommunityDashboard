#!/usr/bin/env node
/**
 * Background scrape runner — spawned detached by /api/refresh.
 * Sequences: enricher scrapers → snapshot archive → marks status done.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dashboardDir = path.join(__dirname, "..");
const scraperDir = path.join(dashboardDir, "..");
const statusFile = path.join(dashboardDir, "public", "data", "scrape-status.json");

function writeStatus(data) {
  fs.writeFileSync(statusFile, JSON.stringify(data));
}

function step(label, fn) {
  console.log(`[scrape] ${label}…`);
  try {
    fn();
    console.log(`[scrape] ${label} done`);
  } catch (err) {
    console.error(`[scrape] ${label} failed:`, err.message);
  }
}

// Run the enricher (updates Notion follower counts from YouTube/Instagram/etc.)
step("enricher", () => {
  execSync("python3 main.py", {
    cwd: path.join(scraperDir, "enricher"),
    stdio: "inherit",
    timeout: 40 * 60 * 1000,
  });
});

// Archive current Notion state as a dated snapshot for the trend charts
step("snapshot", () => {
  execSync(`python3 "${path.join(dashboardDir, "scripts", "generate_snapshot.py")}"`, {
    cwd: dashboardDir,
    stdio: "inherit",
    timeout: 60_000,
  });
});

writeStatus({ running: false, completed_at: new Date().toISOString() });
console.log("[scrape] complete");
