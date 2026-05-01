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

export type PlatformHistoryPoint = {
  month: string;
} & Record<string, number | string>;

function readArchives(): { month: string; snap: Snapshot }[] {
  const dir = path.join(process.cwd(), "public", "data", "snapshots");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({
      month: f.replace(/\.json$/, ""),
      snap: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Snapshot,
    }));
}

export function loadHistory(): HistoryPoint[] {
  return readArchives().map(({ month, snap }) => ({
    month,
    ambassadors: snap.ambassadors.total,
    campus_leaders: snap.campus_leaders.total,
    groups: snap.groups.total,
    total: snap.ambassadors.total + snap.campus_leaders.total + snap.groups.total,
  }));
}

export function loadPlatformHistory(): {
  data: PlatformHistoryPoint[];
  platforms: string[];
} {
  const archives = readArchives();
  const platformSet = new Set<string>();
  const data: PlatformHistoryPoint[] = archives.map(({ month, snap }) => {
    const combined: Record<string, number> = {};
    for (const seg of [snap.ambassadors, snap.campus_leaders, snap.groups]) {
      for (const [k, v] of Object.entries(seg.platforms)) {
        combined[k] = (combined[k] ?? 0) + v;
        platformSet.add(k);
      }
    }
    return { month, ...combined };
  });
  // Order platforms by their latest-month total, descending — keeps the legend useful
  const latest = data[data.length - 1] ?? {};
  const platforms = Array.from(platformSet).sort(
    (a, b) => ((latest[b] as number) ?? 0) - ((latest[a] as number) ?? 0),
  );
  return { data, platforms };
}

export { formatNumber } from "./format";
