"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatNumber } from "@/lib/format";

const COLORS = ["#0b6e99", "#0f7b6c", "#d9730d"];

export function SegmentPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-80 w-full rounded-lg border border-rule bg-paper p-5">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatNumber(v)}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e9e9e7",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#787774" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
