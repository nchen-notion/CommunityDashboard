import fs from "node:fs";
import path from "node:path";
import {
  fetchLiveSnapshotAndTopAmbassadors,
  fetchEvents,
  fetchTopCampusLeaders,
  fetchTopGroups,
} from "./notion";

export type AmbassadorRow = {
  name: string;
  url: string;
  youtube: number;
  instagram: number;
  twitter: number;
  tiktok: number;
  linkedin: number;
  templates: number;
  total: number;
};

export type CampusLeaderRow = {
  name: string;
  url: string;
  linkedin: number;
};

export type GroupRow = {
  name: string;
  url: string;
  platform: string;
  followers: number;
};

export type PlatformTotals = Record<string, number>;

export type LumaEvent = {
  name: string;
  date: string | null;
  rsvpCount: number;
  host: string;
  location: string;
  url: string;
};

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

// Fetches snapshot + top ambassadors in one Notion pass (shared queryAll).
let _liveDataCache: { snapshot: Snapshot; topAmbassadors: AmbassadorRow[] } | null = null;

async function getLiveData() {
  if (!_liveDataCache) {
    _liveDataCache = await fetchLiveSnapshotAndTopAmbassadors();
  }
  return _liveDataCache;
}

export async function loadSnapshot(): Promise<Snapshot> {
  return (await getLiveData()).snapshot;
}

export async function loadTopAmbassadors(): Promise<AmbassadorRow[]> {
  return (await getLiveData()).topAmbassadors;
}

export async function loadTopCampusLeaders(): Promise<CampusLeaderRow[]> {
  return fetchTopCampusLeaders();
}

export async function loadTopGroups(): Promise<GroupRow[]> {
  return fetchTopGroups();
}

export async function loadEvents(): Promise<LumaEvent[]> {
  return fetchEvents();
}

export type HistoryPoint = {
  month: string;
  ambassadors: number;
  campus_leaders: number;
  groups: number;
  events: number;
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

type LiveTotals = { snap: Snapshot; eventsTotal: number };

export function loadHistory(live?: LiveTotals): HistoryPoint[] {
  const archives = readArchives();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const points: HistoryPoint[] = archives.map(({ month, snap }) => ({
    month,
    ambassadors: snap.ambassadors.total,
    campus_leaders: snap.campus_leaders.total,
    groups: snap.groups.total,
    events: 0,
    total: snap.ambassadors.total + snap.campus_leaders.total + snap.groups.total,
  }));
  if (live && !archives.some((a) => a.month === currentMonth)) {
    const { snap, eventsTotal } = live;
    points.push({
      month: currentMonth,
      ambassadors: snap.ambassadors.total,
      campus_leaders: snap.campus_leaders.total,
      groups: snap.groups.total,
      events: eventsTotal,
      total: snap.ambassadors.total + snap.campus_leaders.total + snap.groups.total + eventsTotal,
    });
  }
  return points;
}

export function loadPlatformHistory(live?: LiveTotals): {
  data: PlatformHistoryPoint[];
  platforms: string[];
} {
  const archives = readArchives();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const hasCurrentMonth = archives.some((a) => a.month === currentMonth);
  const allEntries =
    live && !hasCurrentMonth
      ? [...archives, { month: currentMonth, snap: live.snap }]
      : archives;

  const platformSet = new Set<string>();
  const data: PlatformHistoryPoint[] = allEntries.map(({ month, snap }) => {
    const combined: Record<string, number> = {};
    for (const seg of [snap.ambassadors, snap.campus_leaders, snap.groups]) {
      for (const [k, v] of Object.entries(seg.platforms)) {
        combined[k] = (combined[k] ?? 0) + v;
        platformSet.add(k);
      }
    }
    if (live && !hasCurrentMonth && month === currentMonth) {
      combined["Luma Events"] = live.eventsTotal;
      platformSet.add("Luma Events");
    }
    return { month, ...combined };
  });

  const latest = data[data.length - 1] ?? {};
  const platforms = Array.from(platformSet).sort(
    (a, b) => ((latest[b] as number) ?? 0) - ((latest[a] as number) ?? 0),
  );
  return { data, platforms };
}

export { formatNumber } from "./format";
