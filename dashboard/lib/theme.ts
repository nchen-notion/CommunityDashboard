export const SEGMENT_COLORS = {
  Ambassadors: {
    fill: "#0b6e99",
    soft: "#ddebf1",
    border: "#0b6e99",
  },
  "Campus Leaders": {
    fill: "#0f7b6c",
    soft: "#ddedea",
    border: "#0f7b6c",
  },
  Groups: {
    fill: "#d9730d",
    soft: "#faebdd",
    border: "#d9730d",
  },
} as const;

export type SegmentName = keyof typeof SEGMENT_COLORS;

export const PLATFORM_COLORS: Record<string, string> = {
  YouTube: "#e03e3e",
  Instagram: "#ad1a72",
  TikTok: "#191919",
  Twitter: "#0b6e99",
  LinkedIn: "#0b6e99",
  Facebook: "#0b6e99",
  Reddit: "#d9730d",
  Discord: "#6940a5",
  Telegram: "#0b6e99",
  Meetup: "#e03e3e",
  Connpass: "#0f7b6c",
  Peatix: "#0f7b6c",
  Clubhouse: "#dfab01",
  Slack: "#6940a5",
  Circle: "#6940a5",
  Website: "#64473a",
  "Notion templates": "#191919",
};
