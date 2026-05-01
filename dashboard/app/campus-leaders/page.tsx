import { SegmentView } from "@/components/SegmentView";
import { TopCampusLeadersTable } from "@/components/TopCampusLeadersTable";
import { loadSnapshot, loadTopCampusLeaders } from "@/lib/data";

export default async function CampusLeadersPage() {
  const [snap, top] = await Promise.all([loadSnapshot(), loadTopCampusLeaders()]);
  return (
    <div className="space-y-12">
      <SegmentView
        title="Campus Leaders Reach"
        segmentName="Campus Leaders"
        blurb="LinkedIn followers across the Student Leaders database."
        segment={snap.campus_leaders}
      />
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Top 10 by reach</h2>
        <TopCampusLeadersTable rows={top} />
      </section>
    </div>
  );
}
