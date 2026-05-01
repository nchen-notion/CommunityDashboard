import { formatNumber } from "@/lib/format";
import type { CampusLeaderRow } from "@/lib/data";

export function TopCampusLeadersTable({ rows }: { rows: CampusLeaderRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule bg-soft text-right text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="px-4 py-2.5 text-left">Name</th>
            <th className="px-4 py-2.5">LinkedIn Followers</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-rule hover:bg-soft">
              <td className="px-4 py-2.5 font-medium">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {r.name}
                  </a>
                ) : (
                  r.name
                )}
              </td>
              <td className="px-4 py-2.5 text-right font-serif">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="tabular-nums hover:underline">
                    {formatNumber(r.linkedin)}
                  </a>
                ) : (
                  <span className="tabular-nums">{formatNumber(r.linkedin)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
