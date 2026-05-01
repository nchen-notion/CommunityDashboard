import { SegmentView } from "@/components/SegmentView";
import { loadSnapshot } from "@/lib/data";

export default function CampusLeadersPage() {
  const snap = loadSnapshot();
  return (
    <SegmentView
      title="Campus Leaders Reach"
      segmentName="Campus Leaders"
      blurb="LinkedIn followers across the Student Leaders database."
      segment={snap.campus_leaders}
    />
  );
}
