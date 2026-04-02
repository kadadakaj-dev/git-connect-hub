"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; value: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className="rounded-2xl liquid-glass glass-edge p-5"
      data-testid="revenue-chart"
    >
      <h3 className="text-lg font-semibold text-foreground">Trend prijmov</h3>
      <div className="mt-4 h-[200px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }}
              stroke={isDark ? "#222" : "#e2e2e2"}
            />
            <YAxis
              tick={{ fontSize: 11, fill: isDark ? "#a3a3a3" : "#737373" }}
              stroke={isDark ? "#222" : "#e2e2e2"}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${isDark ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.15)"}`,
                backdropFilter: "blur(20px)",
                background: isDark ? "rgba(10,10,10,0.9)" : "rgba(255,255,255,0.9)",
                color: isDark ? "#f2f2f2" : "#1a1a1a",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#d4af37"
              strokeWidth={2}
              fill="url(#revenueFill)"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
