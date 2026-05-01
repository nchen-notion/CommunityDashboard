import { StatCard } from "@/components/StatCard";
import { PlatformBarChart } from "@/components/PlatformBarChart";
import type { SegmentSnapshot } from "@/lib/data";
import { SEGMENT_COLORS, type SegmentName } from "@/lib/theme";

export function SegmentView({
  title,
  segmentName,
  blurb,
  segment,
}: {
  title: string;
  segmentName: SegmentName;
  blurb: string;
  segment: SegmentSnapshot;
}) {
  const bars = Object.entries(segment.platforms)
    .map(([platform, total]) => ({ platform, total }))
    .sort((a, b) => b.total - a.total);

  const accent = SEGMENT_COLORS[segmentName];

  return (
    <div className="space-y-12">
      <div>
        <span
          className="inline-block rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wider"
          style={{ backgroundColor: accent.soft, color: accent.fill }}
        >
          {segmentName}
        </span>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{blurb}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total reach" value={segment.total} accent={accent} />
        <StatCard label="Rows tracked" value={segment.rows} />
        <StatCard label="Platforms" value={Object.keys(segment.platforms).length} />
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Reach by platform</h2>
        {bars.length ? (
          <PlatformBarChart
            data={bars}
            colors={{ total: accent.fill }}
            heightClass="h-[24rem]"
          />
        ) : (
          <p className="rounded-lg border border-dashed border-rule p-8 text-center text-sm text-muted">
            No data yet.
          </p>
        )}
      </section>
    </div>
  );
}
