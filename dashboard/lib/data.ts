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

export { formatNumber } from "./format";
