export const revalidate = 1800;

import { Suspense } from "react";
import { SegmentView } from "@/components/SegmentView";
import { TopCampusLeadersTable } from "@/components/TopCampusLeadersTable";
import { TableSkeleton } from "@/components/TableSkeleton";
import { loadSnapshot, loadTopCampusLeaders } from "@/lib/data";

async function TopTable() {
  const top = await loadTopCampusLeaders();
  return <TopCampusLeadersTable rows={top} />;
}

export default async function CampusLeadersPage() {
  const snap = await loadSnapshot();
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
        <Suspense fallback={<TableSkeleton cols={2} rows={10} />}>
          <TopTable />
        </Suspense>
      </section>
    </div>
  );
}
