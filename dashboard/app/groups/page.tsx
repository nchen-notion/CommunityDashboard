import { SegmentView } from "@/components/SegmentView";
import { loadSnapshot } from "@/lib/data";

export default function GroupsPage() {
  const snap = loadSnapshot();
  return (
    <SegmentView
      title="Groups Reach"
      segmentName="Groups"
      blurb="Member counts across Facebook, Reddit, Discord, Telegram, Meetup, Connpass, Peatix, Clubhouse, Twitter, and Instagram communities."
      segment={snap.groups}
    />
  );
}
