import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import {
  fetchLiveSnapshot,
  fetchEvents,
  fetchSnapshotArchives,
  fetchTopAmbassadors,
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

const _cachedSnapshot = unstable_cache(
  () => fetchLiveSnapshot(),
  ["live-snapshot"],
  { revalidate: 1800 },
);

const _cachedEvents = unstable_cache(
  () => fetchEvents(),
  ["luma-events"],
  { revalidate: 1800 },
);

export async function loadSnapshot(): Promise<Snapshot> {
  return _cachedSnapshot();
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

const _cachedArchives = unstable_cache(
  () => fetchSnapshotArchives(),
  ["snapshot-archives"],
  { revalidate: 6 * 3600 },
);

async function readArchives(): Promise<{ month: string; snap: Snapshot }[]> {
  return _cachedArchives();
}

type LiveTotals = { snap: Snapshot; eventsTotal: number };

export async function loadHistory(live?: LiveTotals): Promise<HistoryPoint[]> {
  const archives = await readArchives();
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

export type DataSourceRow = {
  segment: "Ambassadors" | "Campus Leaders" | "Groups" | "Events";
  label: string;
  values: Record<string, number>; // month -> count (empty if placeholder)
  placeholder?: string;
};

type SourceSpec =
  | { kind: "rows" }
  | { kind: "platform"; key: string }
  | { kind: "placeholder"; text: string }
  | { kind: "events-live" };

type Canonical = {
  segment: DataSourceRow["segment"];
  label: string;
  source: SourceSpec;
};

// Canonical row order + display labels match the user's Notion summary table
const CANONICAL: Canonical[] = [
  { segment: "Ambassadors", label: "Members", source: { kind: "rows" } },
  { segment: "Ambassadors", label: "Youtube Followers", source: { kind: "platform", key: "YouTube" } },
  { segment: "Ambassadors", label: "Instagram Followers", source: { kind: "platform", key: "Instagram" } },
  { segment: "Ambassadors", label: "Twitter Followers", source: { kind: "platform", key: "Twitter" } },
  { segment: "Ambassadors", label: "TikTok Followers", source: { kind: "platform", key: "TikTok" } },
  { segment: "Ambassadors", label: "LinkedIn Followers", source: { kind: "platform", key: "LinkedIn" } },
  { segment: "Ambassadors", label: "Templates Made", source: { kind: "platform", key: "Notion templates" } },

  { segment: "Campus Leaders", label: "Members", source: { kind: "rows" } },
  { segment: "Campus Leaders", label: "LinkedIn Followers", source: { kind: "platform", key: "LinkedIn" } },
  { segment: "Campus Leaders", label: "Instagram Followers", source: { kind: "placeholder", text: "No data" } },
  { segment: "Campus Leaders", label: "Twitter Followers", source: { kind: "placeholder", text: "No data" } },
  { segment: "Campus Leaders", label: "TikTok Followers", source: { kind: "placeholder", text: "No data" } },
  { segment: "Campus Leaders", label: "Youtube Followers", source: { kind: "placeholder", text: "No data" } },

  { segment: "Events", label: "Total RSVPs", source: { kind: "events-live" } },

  { segment: "Groups", label: "Facebook Members", source: { kind: "platform", key: "Facebook" } },
  { segment: "Groups", label: "Meetup Members", source: { kind: "platform", key: "Meetup" } },
  { segment: "Groups", label: "Peatix Members", source: { kind: "platform", key: "Peatix" } },
  { segment: "Groups", label: "Circle Members", source: { kind: "platform", key: "Circle" } },
  { segment: "Groups", label: "LinkedIn Members", source: { kind: "platform", key: "LinkedIn" } },
  { segment: "Groups", label: "Twitter Members", source: { kind: "platform", key: "Twitter" } },
  { segment: "Groups", label: "Reddit Members", source: { kind: "platform", key: "Reddit" } },
  { segment: "Groups", label: "Discord Members", source: { kind: "platform", key: "Discord" } },
  { segment: "Groups", label: "Connpass Members", source: { kind: "platform", key: "Connpass" } },
  { segment: "Groups", label: "Slack Members", source: { kind: "platform", key: "Slack" } },
  { segment: "Groups", label: "Clubhouse Members", source: { kind: "platform", key: "Clubhouse" } },
  { segment: "Groups", label: "Telegram Members", source: { kind: "platform", key: "Telegram" } },
  { segment: "Groups", label: "Instagram Members", source: { kind: "platform", key: "Instagram" } },
  { segment: "Groups", label: "Website Members", source: { kind: "platform", key: "Website" } },
];

function pickSegment(snap: Snapshot, segment: DataSourceRow["segment"]): SegmentSnapshot {
  if (segment === "Ambassadors") return snap.ambassadors;
  if (segment === "Campus Leaders") return snap.campus_leaders;
  return snap.groups;
}

export async function loadDataSourceHistory(live?: LiveTotals): Promise<{
  months: string[];
  rows: DataSourceRow[];
}> {
  const archives = await readArchives();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const hasCurrentMonth = archives.some((a) => a.month === currentMonth);
  const allEntries = live && !hasCurrentMonth
    ? [...archives, { month: currentMonth, snap: live.snap }]
    : archives;
  const months = allEntries.map((a) => a.month);

  const rows: DataSourceRow[] = CANONICAL.map((c) => {
    const row: DataSourceRow = { segment: c.segment, label: c.label, values: {} };
    if (c.source.kind === "placeholder") {
      row.placeholder = c.source.text;
      return row;
    }
    if (c.source.kind === "events-live") {
      if (live) row.values[currentMonth] = live.eventsTotal;
      else row.placeholder = "Live on /events";
      return row;
    }
    for (const { month, snap } of allEntries) {
      const seg = pickSegment(snap, c.segment);
      const v =
        c.source.kind === "rows" ? seg.rows : seg.platforms[c.source.key] ?? 0;
      if (v) row.values[month] = v;
    }
    return row;
  });

  return { months, rows };
}

export async function loadPlatformHistory(live?: LiveTotals): Promise<{
  data: PlatformHistoryPoint[];
  platforms: string[];
}> {
  const archives = await readArchives();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const hasCurrentMonth = archives.some((a) => a.month === currentMonth);
  const allEntries = live && !hasCurrentMonth
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

export async function loadEvents(): Promise<LumaEvent[]> {
  return _cachedEvents();
}

const _cachedTopAmbassadors = unstable_cache(
  () => fetchTopAmbassadors(),
  ["top-ambassadors"],
  { revalidate: 1800 },
);

const _cachedTopCampusLeaders = unstable_cache(
  () => fetchTopCampusLeaders(),
  ["top-campus-leaders"],
  { revalidate: 1800 },
);

const _cachedTopGroups = unstable_cache(
  () => fetchTopGroups(),
  ["top-groups"],
  { revalidate: 1800 },
);

export async function loadTopAmbassadors(): Promise<AmbassadorRow[]> {
  return _cachedTopAmbassadors();
}

export async function loadTopCampusLeaders(): Promise<CampusLeaderRow[]> {
  return _cachedTopCampusLeaders();
}

export async function loadTopGroups(): Promise<GroupRow[]> {
  return _cachedTopGroups();
}

export { formatNumber } from "./format";
