"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY = "rgb(var(--c-primary))";
const MUTED = "rgb(var(--c-muted))";

export function HistoryChart({
  data,
}: {
  data: { label: string; count: number; isToday?: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: MUTED, fontSize: 12 }}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgb(var(--c-overlay) / 0.5)" }}
          formatter={(v) => [Number(v ?? 0).toLocaleString("fa-IR"), "مبحث تمام‌شده"]}
          labelFormatter={() => ""}
          contentStyle={{
            background: "rgb(var(--c-raised))",
            border: "1px solid rgb(var(--c-border))",
            borderRadius: 16,
            color: "rgb(var(--c-text))",
            fontFamily: "inherit",
          }}
        />
        <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={36}>
          {data.map((d, i) => (
            <Cell key={i} fill={PRIMARY} fillOpacity={d.isToday ? 1 : 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
