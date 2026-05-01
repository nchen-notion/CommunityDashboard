export const revalidate = 1800;

import { Suspense } from "react";
import { SegmentView } from "@/components/SegmentView";
import { TopGroupsTable } from "@/components/TopGroupsTable";
import { TableSkeleton } from "@/components/TableSkeleton";
import { loadSnapshot, loadTopGroups } from "@/lib/data";

async function TopTable() {
  const top = await loadTopGroups();
  return <TopGroupsTable rows={top} />;
}

export default async function GroupsPage() {
  const snap = await loadSnapshot();
  return (
    <div className="space-y-12">
      <SegmentView
        title="Groups Reach"
        segmentName="Groups"
        blurb="Member counts across Facebook, Reddit, Discord, Telegram, Meetup, Connpass, Peatix, Clubhouse, Twitter, and Instagram communities."
        segment={snap.groups}
      />
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Top 10 groups</h2>
        <Suspense fallback={<TableSkeleton cols={3} rows={10} />}>
          <TopTable />
        </Suspense>
      </section>
    </div>
  );
}
