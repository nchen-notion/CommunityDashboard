export const dynamic = "force-dynamic";

import { SegmentView } from "@/components/SegmentView";
import { TopAmbassadorsTable } from "@/components/TopAmbassadorsTable";
import { loadSnapshot, loadTopAmbassadors } from "@/lib/data";

export default async function AmbassadorsPage() {
  const [snap, top] = await Promise.all([loadSnapshot(), loadTopAmbassadors()]);
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
        <TopAmbassadorsTable rows={top} />
      </section>
    </div>
  );
}
