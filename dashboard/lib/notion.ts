import type { PlatformTotals, SegmentSnapshot, Snapshot, LumaEvent } from "./data";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const AMBASSADOR_DB = process.env.NOTION_DATABASE_ID ?? "";
const CAMPUS_DB = process.env.NOTION_CAMPUS_LEADERS_DATABASE_ID ?? "";
const GROUPS_DB = process.env.NOTION_GROUPS_DATABASE_ID ?? "";
const EVENTS_DB = process.env.NOTION_LUMA_EVENTS_DATABASE ?? "";

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// Fields to sum per ambassador (display label → Notion property name)
const AMBASSADOR_FIELDS: Record<string, string> = {
  YouTube: "Youtube Followers",
  Instagram: "Instagram Followers",
  TikTok: "TikTok Followers",
  Twitter: "Twitter Followers",
  "Notion templates": "Templates Made",
  LinkedIn: "LinkedIn Followers",
};

async function queryAll(dbId: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Notion API ${res.status} for db ${dbId}`);
    const data = (await res.json()) as {
      results: Record<string, unknown>[];
      has_more: boolean;
      next_cursor?: string;
    };
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return rows;
}

function num(page: Record<string, unknown>, field: string): number {
  const props = page.properties as Record<string, { number?: number | null }>;
  return props?.[field]?.number ?? 0;
}

function richText(page: Record<string, unknown>, field: string): string {
  const props = page.properties as Record<string, { rich_text?: Array<{ plain_text?: string }> }>;
  return (props?.[field]?.rich_text ?? []).map((t) => t.plain_text ?? "").join("").trim();
}

function ttl(page: Record<string, unknown>, field: string): string {
  const props = page.properties as Record<string, { title?: Array<{ plain_text?: string }> }>;
  return (props?.[field]?.title ?? []).map((t) => t.plain_text ?? "").join("").trim();
}

function dateField(page: Record<string, unknown>, field: string): string | null {
  const props = page.properties as Record<string, { date?: { start?: string } | null }>;
  return props?.[field]?.date?.start ?? null;
}

function urlField(page: Record<string, unknown>, field: string): string {
  const props = page.properties as Record<string, { url?: string | null }>;
  return props?.[field]?.url ?? "";
}

function sel(page: Record<string, unknown>, field: string): string {
  const props = page.properties as Record<string, { select?: { name?: string } | null }>;
  return props?.[field]?.select?.name ?? "";
}

async function ambassadorsSegment(): Promise<SegmentSnapshot> {
  const pages = await queryAll(AMBASSADOR_DB);
  const platforms: PlatformTotals = {};
  for (const [label, field] of Object.entries(AMBASSADOR_FIELDS)) {
    platforms[label] = pages.reduce((sum, p) => sum + num(p, field), 0);
  }
  return {
    rows: pages.length,
    total: Object.values(platforms).reduce((s, v) => s + v, 0),
    platforms,
  };
}

async function campusSegment(): Promise<SegmentSnapshot> {
  const pages = await queryAll(CAMPUS_DB);
  const total = pages.reduce((sum, p) => sum + num(p, "LinkedIn Followers"), 0);
  return { rows: pages.length, total, platforms: { LinkedIn: total } };
}

async function groupsSegment(): Promise<SegmentSnapshot> {
  const pages = await queryAll(GROUPS_DB);
  const platforms: PlatformTotals = {};
  for (const page of pages) {
    const plat = sel(page, "Platform") || "Other";
    platforms[plat] = (platforms[plat] ?? 0) + num(page, "Followers");
  }
  return {
    rows: pages.length,
    total: Object.values(platforms).reduce((s, v) => s + v, 0),
    platforms,
  };
}

export async function fetchEvents(): Promise<LumaEvent[]> {
  if (!EVENTS_DB) return [];
  const pages = await queryAll(EVENTS_DB);
  return pages
    .map((page) => ({
      name: ttl(page, "Name"),
      date: dateField(page, "Date"),
      rsvpCount: num(page, "RSVP Count"),
      host: richText(page, "Host"),
      location: richText(page, "Location"),
      url: urlField(page, "Link to Event"),
    }))
    .filter((e) => e.name && (!e.date || e.date <= new Date().toISOString().slice(0, 10)))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
}

export async function fetchLiveSnapshot(): Promise<Snapshot> {
  const [ambassadors, campus_leaders, groups] = await Promise.all([
    ambassadorsSegment(),
    campusSegment(),
    groupsSegment(),
  ]);
  return {
    generated_at: new Date().toISOString(),
    ambassadors,
    campus_leaders,
    groups,
  };
}
