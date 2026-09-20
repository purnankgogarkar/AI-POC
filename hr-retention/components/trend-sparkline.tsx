"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { QuarterRisk } from "@/lib/types";

export function TrendSparkline({ data, height = 56 }: { data: QuarterRisk[]; height?: number }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="quarter" hide />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(value) => [`${value}`, "Avg. risk"]}
          />
          <Area
            type="monotone"
            dataKey="risk"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#sparklineFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
