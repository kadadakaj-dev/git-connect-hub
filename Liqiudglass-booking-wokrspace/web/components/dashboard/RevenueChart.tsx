"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Point = {
  label: string;
  value: number;
};

export function RevenueChart({ data }: { data: Point[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="glass-edge rounded-2xl bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl" data-testid="revenue-chart">
      <h3 className="text-xl font-semibold text-foreground">Trend príjmov</h3>
      <div className="mt-4 h-[200px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.25)"} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: isDark ? "#a3a3a3" : "#737373" }} stroke={isDark ? "#333" : "#e2e2e2"} />
            <YAxis tick={{ fontSize: 12, fill: isDark ? "#a3a3a3" : "#737373" }} stroke={isDark ? "#333" : "#e2e2e2"} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${isDark ? "rgba(212,175,55,0.3)" : "rgba(212,175,55,0.2)"}`,
                backdropFilter: "blur(20px)",
                background: isDark ? "rgba(17,17,17,0.95)" : "rgba(255,255,255,0.95)",
                color: isDark ? "#f2f2f2" : "#1a1a1a",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#d4af37"
              strokeWidth={2.5}
              fill="url(#revenueFill)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
