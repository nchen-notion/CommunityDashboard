import { StatCard } from "@/components/StatCard";
import { PlatformBarChart } from "@/components/PlatformBarChart";
import { SegmentPieChart } from "@/components/SegmentPieChart";
import { TrendChart } from "@/components/TrendChart";
import { PlatformTrendChart } from "@/components/PlatformTrendChart";
import {
  loadSnapshot,
  loadHistory,
  loadPlatformHistory,
  loadEvents,
} from "@/lib/data";
import { SEGMENT_COLORS } from "@/lib/theme";

export default async function Home() {
  const [snap, events] = await Promise.all([loadSnapshot(), loadEvents()]);
  const eventsTotal = events.reduce((s, e) => s + e.rsvpCount, 0);
  const live = { snap, eventsTotal };
  const history = loadHistory(live);
  const platformHistory = loadPlatformHistory(live);
  const segments = [
    { name: "Ambassadors", value: snap.ambassadors.total },
    { name: "Campus Leaders", value: snap.campus_leaders.total },
    { name: "Groups", value: snap.groups.total },
    { name: "Events", value: eventsTotal },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);

  const platformSet = new Set<string>([
    ...Object.keys(snap.ambassadors.platforms),
    ...Object.keys(snap.campus_leaders.platforms),
    ...Object.keys(snap.groups.platforms),
  ]);
  const bars = [
    {
      platform: "Luma Events",
      Ambassadors: 0,
      "Campus Leaders": 0,
      Groups: 0,
      Events: eventsTotal,
      _total: eventsTotal,
    },
    ...Array.from(platformSet).map((platform) => {
      const a = snap.ambassadors.platforms[platform] ?? 0;
      const c = snap.campus_leaders.platforms[platform] ?? 0;
      const g = snap.groups.platforms[platform] ?? 0;
      return {
        platform,
        Ambassadors: a,
        "Campus Leaders": c,
        Groups: g,
        Events: 0,
        _total: a + c + g,
      };
    }),
  ].sort((a, b) => b._total - a._total);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
          Community Aggregate Reach
        </h1>
        <p className="mt-2 text-sm text-muted">Live from Notion</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total reach" value={total} />
        <StatCard
          label="Ambassadors"
          value={snap.ambassadors.total}
          sub={`${snap.ambassadors.rows} people`}
          accent={SEGMENT_COLORS.Ambassadors}
        />
        <StatCard
          label="Campus Leaders"
          value={snap.campus_leaders.total}
          sub={`${snap.campus_leaders.rows} people`}
          accent={SEGMENT_COLORS["Campus Leaders"]}
        />
        <StatCard
          label="Groups"
          value={snap.groups.total}
          sub={`${snap.groups.rows} groups`}
          accent={SEGMENT_COLORS.Groups}
        />
        <StatCard
          label="Event RSVPs"
          value={eventsTotal}
          sub={`${events.length} events`}
          accent={SEGMENT_COLORS.Events}
        />
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Reach by segment</h2>
        <SegmentPieChart data={segments} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Reach over time
          {history.length < 2 ? (
            <span className="ml-3 align-middle text-sm font-normal text-muted">
              — first snapshot. Trend builds as monthly snapshots accumulate.
            </span>
          ) : null}
        </h2>
        <TrendChart data={history} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Reach by platform <span className="text-muted">— all segments combined</span>
        </h2>
        <PlatformBarChart
          data={bars}
          keys={["Ambassadors", "Campus Leaders", "Groups", "Events"]}
          colors={{ Events: "#6940a5" }}
          heightClass="h-[28rem]"
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Reach by platform over time
          {platformHistory.data.length < 2 ? (
            <span className="ml-3 align-middle text-sm font-normal text-muted">
              — first snapshot. Trend builds as monthly snapshots accumulate.
            </span>
          ) : null}
        </h2>
        <PlatformTrendChart data={platformHistory.data} platforms={platformHistory.platforms} />
      </section>

      <p className="text-sm text-muted">
        <a
          href="https://www.notion.so/Community-Data-Scrape-352acd52633380689c7efd08da2097cc?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Data source ↗
        </a>
      </p>
    </div>
  );
}

