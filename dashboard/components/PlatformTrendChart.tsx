"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";
import { PLATFORM_COLORS } from "@/lib/theme";
import type { PlatformHistoryPoint } from "@/lib/data";

const FALLBACK_PALETTE = [
  "#0b6e99",
  "#0f7b6c",
  "#d9730d",
  "#6940a5",
  "#ad1a72",
  "#e03e3e",
  "#dfab01",
  "#64473a",
  "#191919",
  "#787774",
];

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function PlatformTrendChart({
  data,
  platforms,
}: {
  data: PlatformHistoryPoint[];
  platforms: string[];
}) {
  const formatted = data.map((d) => ({ ...d, label: formatMonth(d.month as string) }));
  const onePoint = formatted.length < 2;

  const colorFor = (platform: string, i: number) =>
    PLATFORM_COLORS[platform] ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];

  return (
    <div className="h-[28rem] w-full rounded-lg border border-rule bg-paper p-5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#787774", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#e9e9e7" }}
          />
          <YAxis
            tickFormatter={formatNumber}
            tick={{ fill: "#787774", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v: number) => formatNumber(v)}
            cursor={{ stroke: "#e9e9e7" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e9e9e7",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#787774" }} />
          {platforms.map((p, i) => (
            <Area
              key={p}
              type="monotone"
              dataKey={p}
              name={p}
              stackId="1"
              stroke={colorFor(p, i)}
              strokeWidth={1.5}
              fill={colorFor(p, i)}
              fillOpacity={0.7}
              dot={onePoint ? { r: 3, fill: colorFor(p, i), stroke: colorFor(p, i) } : false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
