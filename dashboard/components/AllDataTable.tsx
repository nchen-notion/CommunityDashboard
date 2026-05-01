import { formatNumber } from "@/lib/format";
import type { Snapshot } from "@/lib/data";
import { SEGMENT_COLORS } from "@/lib/theme";

type Row = { label: string; value: number };
type Group = { segment: string; color: string; soft: string; rows: Row[] };

export function AllDataTable({
  snap,
  eventsTotal,
  eventCount,
}: {
  snap: Snapshot;
  eventsTotal: number;
  eventCount: number;
}) {
  const groups: Group[] = [
    {
      segment: "Ambassadors",
      color: SEGMENT_COLORS.Ambassadors.fill,
      soft: SEGMENT_COLORS.Ambassadors.soft,
      rows: [
        { label: "Members", value: snap.ambassadors.rows },
        { label: "YouTube Followers", value: snap.ambassadors.platforms["YouTube"] ?? 0 },
        { label: "Instagram Followers", value: snap.ambassadors.platforms["Instagram"] ?? 0 },
        { label: "Twitter Followers", value: snap.ambassadors.platforms["Twitter"] ?? 0 },
        { label: "TikTok Followers", value: snap.ambassadors.platforms["TikTok"] ?? 0 },
        { label: "LinkedIn Followers", value: snap.ambassadors.platforms["LinkedIn"] ?? 0 },
        { label: "Templates Made", value: snap.ambassadors.platforms["Notion templates"] ?? 0 },
      ],
    },
    {
      segment: "Campus Leaders",
      color: SEGMENT_COLORS["Campus Leaders"].fill,
      soft: SEGMENT_COLORS["Campus Leaders"].soft,
      rows: [
        { label: "Members", value: snap.campus_leaders.rows },
        { label: "LinkedIn Followers", value: snap.campus_leaders.platforms["LinkedIn"] ?? 0 },
      ],
    },
    {
      segment: "Events",
      color: SEGMENT_COLORS.Events.fill,
      soft: SEGMENT_COLORS.Events.soft,
      rows: [
        { label: "Total Events", value: eventCount },
        { label: "Total RSVPs", value: eventsTotal },
      ],
    },
    {
      segment: "Groups",
      color: SEGMENT_COLORS.Groups.fill,
      soft: SEGMENT_COLORS.Groups.soft,
      rows: Object.entries(snap.groups.platforms)
        .sort((a, b) => b[1] - a[1])
        .map(([platform, value]) => ({ label: `${platform} Members`, value })),
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule bg-soft">
            <th className="px-4 py-2.5 text-left font-semibold text-muted">Metric</th>
            <th className="px-4 py-2.5 text-right font-semibold text-muted">Count</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, gi) => (
            <>
              <tr key={`hdr-${gi}`} className={gi > 0 ? "border-t-2 border-rule" : ""}>
                <td
                  colSpan={2}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: group.color, backgroundColor: group.soft }}
                >
                  {group.segment}
                </td>
              </tr>
              {group.rows.map((row, ri) => (
                <tr key={`row-${gi}-${ri}`} className="border-t border-rule hover:bg-soft">
                  <td className="px-4 py-2.5 pl-8 text-ink">{row.label}</td>
                  <td className="px-4 py-2.5 text-right font-serif tabular-nums text-ink">
                    {formatNumber(row.value)}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
