#!/usr/bin/env node
/**
 * Background scrape runner — spawned detached by /api/refresh.
 * Sequences: ambassadors → campus leaders → groups → luma events → snapshot.
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
    // Continue to next step — a partial failure shouldn't halt the whole run
  }
}

// 1. Ambassadors — YouTube, Instagram, TikTok, Twitter, Notion templates
step("ambassadors", () => {
  execSync("python3 main.py", {
    cwd: path.join(scraperDir, "enricher"),
    stdio: "inherit",
    timeout: 90 * 60 * 1000,
  });
});

// 2. Campus Leaders — LinkedIn followers
step("campus leaders", () => {
  execSync("python3 linkedin_followers.py", {
    cwd: path.join(scraperDir, "campus_leaders"),
    stdio: "inherit",
    timeout: 30 * 60 * 1000,
  });
});

// 3. Groups — Facebook, Reddit, Discord, Telegram, Meetup, etc.
//    LinkedIn, Slack, Circle, Website are skipped automatically (no scraper).
//    Only writes to Notion if a new count was successfully scraped.
step("groups", () => {
  execSync("python3 main.py", {
    cwd: path.join(scraperDir, "groups"),
    stdio: "inherit",
    timeout: 60 * 60 * 1000,
  });
});

// 4. Luma events — additive only, creates rows for new events not yet in Notion
step("luma events", () => {
  execSync("python3 main.py", {
    cwd: path.join(scraperDir, "luma"),
    stdio: "inherit",
    timeout: 10 * 60 * 1000,
  });
});

// 5. Archive current Notion state as a dated snapshot for the trend charts
step("snapshot", () => {
  execSync(`python3 "${path.join(dashboardDir, "scripts", "generate_snapshot.py")}"`, {
    cwd: dashboardDir,
    stdio: "inherit",
    timeout: 60_000,
  });
});

writeStatus({ running: false, completed_at: new Date().toISOString() });
console.log("[scrape] complete");
