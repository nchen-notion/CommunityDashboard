export const dynamic = "force-dynamic";

import { StatCard } from "@/components/StatCard";
import { PlatformBarChart } from "@/components/PlatformBarChart";
import { SegmentPieChart } from "@/components/SegmentPieChart";
import { TrendChart } from "@/components/TrendChart";
import { PlatformTrendChart } from "@/components/PlatformTrendChart";
import { AllDataTable } from "@/components/AllDataTable";
import {
  loadSnapshot,
  loadHistory,
  loadPlatformHistory,
} from "@/lib/data";
import { SEGMENT_COLORS } from "@/lib/theme";

export default async function Home() {
  const snap = await loadSnapshot();
  const live = { snap, eventsTotal: 0 };
  const [history, platformHistory] = await Promise.all([
    loadHistory(live),
    loadPlatformHistory(live),
  ]);
  const segments = [
    { name: "Ambassadors", value: snap.ambassadors.total },
    { name: "Campus Leaders", value: snap.campus_leaders.total },
    { name: "Groups", value: snap.groups.total },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);

  const platformSet = new Set<string>([
    ...Object.keys(snap.ambassadors.platforms),
    ...Object.keys(snap.campus_leaders.platforms),
    ...Object.keys(snap.groups.platforms),
  ]);
  const bars = Array.from(platformSet).map((platform) => {
    const a = snap.ambassadors.platforms[platform] ?? 0;
    const c = snap.campus_leaders.platforms[platform] ?? 0;
    const g = snap.groups.platforms[platform] ?? 0;
    return { platform, Ambassadors: a, "Campus Leaders": c, Groups: g, _total: a + c + g };
  }).sort((a, b) => b._total - a._total);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
          Community Aggregate Reach
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          keys={["Ambassadors", "Campus Leaders", "Groups"]}
          colors={{}}
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
        <PlatformTrendChart data={platformHistory.data} platforms={platformHistory.platforms.filter(p => p !== "Luma Events")} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">All data</h2>
        <AllDataTable snap={snap} />
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

