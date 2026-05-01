import { SegmentView } from "@/components/SegmentView";
import { loadSnapshot } from "@/lib/data";

export default async function CampusLeadersPage() {
  const snap = await loadSnapshot();
  return (
    <SegmentView
      title="Campus Leaders Reach"
      segmentName="Campus Leaders"
      blurb="LinkedIn followers across the Student Leaders database."
      segment={snap.campus_leaders}
    />
  );
}
