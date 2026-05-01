import { StatCard } from "@/components/StatCard";
import { PlatformBarChart } from "@/components/PlatformBarChart";
import { SegmentPieChart } from "@/components/SegmentPieChart";
import { TrendChart } from "@/components/TrendChart";
import { PlatformTrendChart } from "@/components/PlatformTrendChart";
import { loadSnapshot, loadHistory, loadPlatformHistory } from "@/lib/data";
import { SEGMENT_COLORS } from "@/lib/theme";

export default function Home() {
  const snap = loadSnapshot();
  const history = loadHistory();
  const platformHistory = loadPlatformHistory();
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SourceCard
            title="Ambassador Database"
            rows={snap.ambassadors.rows}
            description="YouTube, Instagram, TikTok, Twitter, Notion templates, and LinkedIn follower counts pulled from Apify actors."
          />
          <SourceCard
            title="Campus Leaders Database"
            rows={snap.campus_leaders.rows}
            description="LinkedIn follower counts via apimaestro/linkedin-profile-detail."
          />
          <SourceCard
            title="Membership Database"
            rows={snap.groups.rows}
            description="Group sizes across Facebook, Reddit, Discord, Telegram, Meetup, Connpass, Peatix, Clubhouse, Twitter, Instagram via Apify + Firecrawl."
          />
        </div>
        <p className="pt-2 text-xs text-muted">
          Snapshots refresh on the 1st of every month at 06:00 UTC.
        </p>
      </section>
    </div>
  );
}

function SourceCard({
  title,
  rows,
  description,
}: {
  title: string;
  rows: number;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-rule bg-paper p-5">
      <div className="font-serif text-base font-semibold text-ink">{title}</div>
      <div className="mt-1 text-xs text-muted">{rows.toLocaleString()} rows</div>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{description}</p>
    </div>
  );
}
