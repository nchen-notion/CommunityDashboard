import { formatNumber } from "@/lib/format";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: { fill: string; soft: string };
}) {
  const style = accent
    ? { borderColor: accent.fill, backgroundColor: accent.soft }
    : undefined;
  const labelStyle = accent ? { color: accent.fill } : undefined;
  return (
    <div
      className="rounded-lg border border-rule bg-paper p-6 transition-all hover:shadow-sm"
      style={style}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
        style={labelStyle}
      >
        {label}
      </div>
      <div className="mt-3 font-serif text-3xl font-semibold tabular-nums text-ink">
        {formatNumber(value)}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
