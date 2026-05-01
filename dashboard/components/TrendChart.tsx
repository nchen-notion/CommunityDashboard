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
import type { HistoryPoint } from "@/lib/data";

const SERIES = [
  { key: "ambassadors", label: "Ambassadors", color: "#0b6e99" },
  { key: "campus_leaders", label: "Campus Leaders", color: "#0f7b6c" },
  { key: "groups", label: "Groups", color: "#d9730d" },
  { key: "events", label: "Events", color: "#6940a5" },
] as const;

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function TrendChart({ data }: { data: HistoryPoint[] }) {
  const formatted = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  const onePoint = formatted.length < 2;

  return (
    <div className="h-80 w-full rounded-lg border border-rule bg-paper p-5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
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
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={onePoint ? { r: 4, fill: s.color, stroke: s.color } : { r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
