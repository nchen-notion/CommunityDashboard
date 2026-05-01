import { StatCard } from "@/components/StatCard";
import { PlatformBarChart } from "@/components/PlatformBarChart";
import { SegmentPieChart } from "@/components/SegmentPieChart";
import { TrendChart } from "@/components/TrendChart";
import { PlatformTrendChart } from "@/components/PlatformTrendChart";
import { DataSourceTable } from "@/components/DataSourceTable";
import {
  loadSnapshot,
  loadHistory,
  loadPlatformHistory,
  loadDataSourceHistory,
} from "@/lib/data";
import { SEGMENT_COLORS } from "@/lib/theme";

export default function Home() {
  const snap = loadSnapshot();
  const history = loadHistory();
  const platformHistory = loadPlatformHistory();
  const dataSources = loadDataSourceHistory();
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
  const bars = Array.from(platformSet)
    .map((platform) => {
      const a = snap.ambassadors.platforms[platform] ?? 0;
      const c = snap.campus_leaders.platforms[platform] ?? 0;
      const g = snap.groups.platforms[platform] ?? 0;
      return {
        platform,
        Ambassadors: a,
        "Campus Leaders": c,
        Groups: g,
        _total: a + c + g,
      };
    })
    .sort((a, b) => b._total - a._total);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
          Community Aggregate Reach
        </h1>
        <p className="mt-2 text-sm text-muted">
          {snap.generated_at
            ? `Snapshot generated ${new Date(snap.generated_at).toLocaleDateString()}`
            : "No snapshot yet — run `npm run snapshot`."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Data sources</h2>
        <p className="text-sm text-muted">
          Each row is one (segment, platform) reading. A new column lands every 1st of the month at 06:00 UTC.
        </p>
        <DataSourceTable months={dataSources.months} rows={dataSources.rows} />
      </section>
    </div>
  );
}

