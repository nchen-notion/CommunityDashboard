export const revalidate = 1800;

import { SegmentView } from "@/components/SegmentView";
import { TopGroupsTable } from "@/components/TopGroupsTable";
import { loadSnapshot, loadTopGroups } from "@/lib/data";

export default async function GroupsPage() {
  const [snap, top] = await Promise.all([loadSnapshot(), loadTopGroups()]);
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
        <TopGroupsTable rows={top} />
      </section>
    </div>
  );
}
