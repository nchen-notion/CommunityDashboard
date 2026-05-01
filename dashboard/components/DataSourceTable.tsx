import { formatNumber } from "@/lib/format";
import type { DataSourceRow } from "@/lib/data";
import { SEGMENT_COLORS } from "@/lib/theme";

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function DataSourceTable({
  months,
  rows,
}: {
  months: string[];
  rows: DataSourceRow[];
}) {
  // Newest month first so the latest column is always visible without scrolling
  const orderedMonths = [...months].reverse();
  const latest = months[months.length - 1];
  const previous = months[months.length - 2];

  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-paper">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-soft text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <th className="px-4 py-3 font-semibold">Segment</th>
            <th className="px-4 py-3 font-semibold">Platform</th>
            {orderedMonths.map((m) => (
              <th key={m} className="px-4 py-3 text-right font-semibold">
                {formatMonth(m)}
              </th>
            ))}
            {previous ? <th className="px-4 py-3 text-right font-semibold">Δ MoM</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const segColor = SEGMENT_COLORS[row.segment];
            const isPlaceholder = !!row.placeholder;
            const latestVal = latest ? row.values[latest] ?? 0 : 0;
            const prevVal = previous ? row.values[previous] ?? 0 : null;
            const delta =
              !isPlaceholder && prevVal !== null ? latestVal - prevVal : null;
            return (
              <tr
                key={`${row.segment}::${row.label}`}
                className="border-b border-rule last:border-b-0 hover:bg-soft"
              >
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider"
                    style={{ backgroundColor: segColor.soft, color: segColor.fill }}
                  >
                    {row.segment}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                {orderedMonths.map((m, i) => {
                  if (isPlaceholder) {
                    return i === 0 ? (
                      <td
                        key={m}
                        colSpan={orderedMonths.length}
                        className="px-4 py-3 text-right text-xs italic text-muted"
                      >
                        {row.placeholder}
                      </td>
                    ) : null;
                  }
                  const v = row.values[m];
                  return (
                    <td key={m} className="px-4 py-3 text-right tabular-nums text-ink/80">
                      {v ? formatNumber(v) : <span className="text-muted">—</span>}
                    </td>
                  );
                })}
                {previous ? (
                  delta !== null ? (
                    <td
                      className="px-4 py-3 text-right text-xs tabular-nums"
                      style={{
                        color: delta > 0 ? "#0f7b6c" : delta < 0 ? "#e03e3e" : "#787774",
                      }}
                    >
                      {delta > 0 ? "+" : ""}
                      {formatNumber(delta)}
                    </td>
                  ) : (
                    <td className="px-4 py-3 text-right text-xs text-muted">—</td>
                  )
                ) : null}
              </tr>
            );
          })}
          {months.length > 0 ? (
            <tr className="border-t-2 border-rule bg-soft font-semibold text-ink">
              <td className="px-4 py-3" colSpan={2}>
                Total
              </td>
              {orderedMonths.map((m) => {
                const sum = rows.reduce(
                  (acc, r) => acc + (r.values[m] ?? 0),
                  0,
                );
                return (
                  <td
                    key={m}
                    className="px-4 py-3 text-right tabular-nums"
                  >
                    {sum ? formatNumber(sum) : <span className="text-muted">—</span>}
                  </td>
                );
              })}
              {previous ? (() => {
                const lSum = rows.reduce(
                  (a, r) => a + (latest ? r.values[latest] ?? 0 : 0),
                  0,
                );
                const pSum = rows.reduce(
                  (a, r) => a + (previous ? r.values[previous] ?? 0 : 0),
                  0,
                );
                const d = lSum - pSum;
                return (
                  <td
                    className="px-4 py-3 text-right text-xs tabular-nums"
                    style={{
                      color: d > 0 ? "#0f7b6c" : d < 0 ? "#e03e3e" : "#787774",
                    }}
                  >
                    {d > 0 ? "+" : ""}
                    {formatNumber(d)}
                  </td>
                );
              })() : null}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
