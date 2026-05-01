import { formatNumber } from "@/lib/format";
import type { AmbassadorRow } from "@/lib/data";

function Linked({ href, value }: { href: string; value: number }) {
  if (!href || value === 0) return <span className="text-muted">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tabular-nums hover:underline"
    >
      {formatNumber(value)}
    </a>
  );
}

export function TopAmbassadorsTable({ rows }: { rows: AmbassadorRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule bg-soft text-right text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="px-4 py-2.5 text-left">Name</th>
            <th className="px-4 py-2.5">YouTube</th>
            <th className="px-4 py-2.5">Instagram</th>
            <th className="px-4 py-2.5">Twitter</th>
            <th className="px-4 py-2.5">TikTok</th>
            <th className="px-4 py-2.5">LinkedIn</th>
            <th className="px-4 py-2.5">Templates</th>
            <th className="px-4 py-2.5 font-bold text-ink">Total</th>
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
              <td className="px-4 py-2.5 text-right font-serif"><Linked href={r.url} value={r.youtube} /></td>
              <td className="px-4 py-2.5 text-right font-serif"><Linked href={r.url} value={r.instagram} /></td>
              <td className="px-4 py-2.5 text-right font-serif"><Linked href={r.url} value={r.twitter} /></td>
              <td className="px-4 py-2.5 text-right font-serif"><Linked href={r.url} value={r.tiktok} /></td>
              <td className="px-4 py-2.5 text-right font-serif"><Linked href={r.url} value={r.linkedin} /></td>
              <td className="px-4 py-2.5 text-right font-serif"><Linked href={r.url} value={r.templates} /></td>
              <td className="px-4 py-2.5 text-right font-serif font-semibold text-ink">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {formatNumber(r.total)}
                  </a>
                ) : (
                  formatNumber(r.total)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
