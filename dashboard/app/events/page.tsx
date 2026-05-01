
import { loadEvents } from "@/lib/data";
import { formatNumber, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { SEGMENT_COLORS } from "@/lib/theme";

export default async function EventsPage() {
  const events = await loadEvents();
  const totalRSVPs = events.reduce((s, e) => s + e.rsvpCount, 0);
  const avgRSVPs = events.length ? Math.round(totalRSVPs / events.length) : 0;
  const accent = SEGMENT_COLORS.Events;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
          Luma Events
        </h1>
        <p className="mt-2 text-sm text-muted">Live from Notion · {events.length} events</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total RSVPs" value={totalRSVPs} accent={accent} />
        <StatCard label="Total events" value={events.length} sub="all time" />
        <StatCard label="Avg RSVPs / event" value={avgRSVPs} />
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">All events</h2>
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule bg-soft text-left">
                <th className="px-4 py-3 font-semibold text-muted">Event</th>
                <th className="px-4 py-3 font-semibold text-muted">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-muted">RSVPs</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event, i) => (
                  <tr
                    key={i}
                    className="border-b border-rule last:border-0 transition-colors hover:bg-soft"
                  >
                    <td className="px-4 py-3 font-medium">
                      {event.url ? (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {event.name}
                        </a>
                      ) : (
                        event.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(event.date)}</td>
                    <td className="px-4 py-3 text-right font-serif tabular-nums">
                      {formatNumber(event.rsvpCount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
