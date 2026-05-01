import fs from "node:fs";
import path from "node:path";

export type PlatformTotals = Record<string, number>;

export type SegmentSnapshot = {
  rows: number;
  total: number;
  platforms: PlatformTotals;
};

export type Snapshot = {
  generated_at: string;
  ambassadors: SegmentSnapshot;
  campus_leaders: SegmentSnapshot;
  groups: SegmentSnapshot;
};

const EMPTY: SegmentSnapshot = { rows: 0, total: 0, platforms: {} };

export function loadSnapshot(): Snapshot {
  const file = path.join(process.cwd(), "public", "data", "snapshot.json");
  if (!fs.existsSync(file)) {
    return {
      generated_at: "",
      ambassadors: EMPTY,
      campus_leaders: EMPTY,
      groups: EMPTY,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export type HistoryPoint = {
  month: string;
  ambassadors: number;
  campus_leaders: number;
  groups: number;
  total: number;
};

export function loadHistory(): HistoryPoint[] {
  const dir = path.join(process.cwd(), "public", "data", "snapshots");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const snap: Snapshot = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const month = f.replace(/\.json$/, "");
      return {
        month,
        ambassadors: snap.ambassadors.total,
        campus_leaders: snap.campus_leaders.total,
        groups: snap.groups.total,
        total: snap.ambassadors.total + snap.campus_leaders.total + snap.groups.total,
      };
    });
}

export { formatNumber } from "./format";
