"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

type Row = { platform: string } & Record<string, number | string>;

export function PlatformBarChart({
  data,
  keys,
  colors,
  heightClass = "h-80",
}: {
  data: Row[];
  keys?: string[];
  colors?: Record<string, string>;
  heightClass?: string;
}) {
  const stackKeys = keys ?? ["total"];
  const palette: Record<string, string> = {
    total: "#0b6e99",
    Ambassadors: "#0b6e99",
    "Campus Leaders": "#0f7b6c",
    Groups: "#d9730d",
    ...(colors ?? {}),
  };
  return (
    <div className={`${heightClass} w-full rounded-lg border border-rule bg-paper p-5`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
          <XAxis
            dataKey="platform"
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
            cursor={{ fill: "#f7f6f3" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e9e9e7",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />
          {stackKeys.length > 1 ? (
            <Legend wrapperStyle={{ fontSize: 12, color: "#787774" }} />
          ) : null}
          {stackKeys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="a"
              fill={palette[k] ?? "#191919"}
              radius={i === stackKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
