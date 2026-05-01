
import { Suspense } from "react";
import { SegmentView } from "@/components/SegmentView";
import { TopAmbassadorsTable } from "@/components/TopAmbassadorsTable";
import { TableSkeleton } from "@/components/TableSkeleton";
import { loadSnapshot, loadTopAmbassadors } from "@/lib/data";

async function TopTable() {
  const top = await loadTopAmbassadors();
  return <TopAmbassadorsTable rows={top} />;
}

export default async function AmbassadorsPage() {
  const snap = await loadSnapshot();
  return (
    <div className="space-y-12">
      <SegmentView
        title="Ambassador Reach"
        segmentName="Ambassadors"
        blurb="Reach across YouTube, Instagram, TikTok, Twitter, Notion templates, and LinkedIn."
        segment={snap.ambassadors}
      />
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Top 10 by reach</h2>
        <Suspense fallback={<TableSkeleton cols={8} rows={10} />}>
          <TopTable />
        </Suspense>
      </section>
    </div>
  );
}
