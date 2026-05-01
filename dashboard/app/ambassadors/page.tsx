import { SegmentView } from "@/components/SegmentView";
import { loadSnapshot } from "@/lib/data";

export default async function AmbassadorsPage() {
  const snap = await loadSnapshot();
  return (
    <SegmentView
      title="Ambassador Reach"
      segmentName="Ambassadors"
      blurb="Reach across YouTube, Instagram, TikTok, Twitter, Notion templates, and LinkedIn."
      segment={snap.ambassadors}
    />
  );
}
