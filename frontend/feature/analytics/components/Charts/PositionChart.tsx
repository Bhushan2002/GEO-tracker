"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/* ---------- Types ---------- */
interface PositionChartProp {
  data: any[];
}

/* ---------- Brand Color Palette (Consistent across all charts) ---------- */
const BRAND_COLORS = [
  "#EF4444", // red
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#F43F5E", // rose
  "#A855F7", // violet
  "#22D3EE", // sky
  "#FB923C", // orange-400
];

/* ---------- Tooltip ---------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 12,
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>

      {payload.map((item: any) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: item.stroke,
              }}
            />
            <span>{item.name}</span>
          </div>
          <span style={{ fontWeight: 600 }}>
            {item.payload?.__rawRanks?.[item.name] ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Line chart visualizing the movement of brand rankings over time.
 * Calculates average rank and displays discrete lanes for top brands.
 */
export function PositionChart({ data }: PositionChartProp) {
  const { chartData, brands, hasData, brandColors } = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], brands: [], hasData: false, brandColors: {} };
    }

    /* ---- Compute avg rank per brand ---- */
    const stats: Record<string, { sum: number; count: number }> = {};
    const colors: Record<string, string> = {};
    const brandIndex: Record<string, number> = {};
    let currentIndex = 0;

    data.forEach((row) => {
      if (row.lastRank == null) return;
      const rank = Number(row.lastRank);
      if (Number.isNaN(rank)) return;

      if (!stats[row.name]) {
        stats[row.name] = { sum: 0, count: 0 };
        brandIndex[row.name] = currentIndex++;
      }
      stats[row.name].sum += rank;
      stats[row.name].count += 1;

      // Store brand color if available
      if (row.color && !colors[row.name]) {
        colors[row.name] = row.color;
      }
    });

    // Assign fallback colors to brands that don't have one
    Object.keys(stats).forEach((brandName) => {
      if (!colors[brandName]) {
        colors[brandName] = BRAND_COLORS[brandIndex[brandName] % BRAND_COLORS.length];
      }
    });

    /* ---- Top 7 brands by best average rank ---- */
    const topBrands = Object.entries(stats)
      .map(([brand, s]) => ({ brand, avg: s.sum / s.count }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 7)
      .map((b) => b.brand);

    /* ---- Build timeseries with DISCRETE LANES ---- */
    const map: Record<string, any> = {};

    data.forEach((row) => {
      if (!topBrands.includes(row.name)) return;

      if (!map[row.timeStamp]) {
        map[row.timeStamp] = {
          timeStamp: row.timeStamp,
          __rawRanks: {},
        };
      }

      const rank =
        row.lastRank == null ? null : Number(row.lastRank);

      // 👇 CRITICAL FIX: convert rank → lane
      const lane = rank == null ? null : 11 - rank;

      map[row.timeStamp].__rawRanks[row.name] = rank;
      map[row.timeStamp][row.name] = lane;
    });

    /* ---- Sort dates safely ---- */
    const transformed = Object.values(map).sort((a: any, b: any) => {
      const da = new Date(a.timeStamp.split("/").reverse().join("-"));
      const db = new Date(b.timeStamp.split("/").reverse().join("-"));
      return da.getTime() - db.getTime();
    });

    /* ---- Keep only brands with rank movement ---- */
    const dynamicBrands = topBrands.filter((brand) => {
      const values = transformed
        .map((d: any) => d[brand])
        .filter((v: any) => v != null);

      return new Set(values).size > 1;
    });

    return {
      chartData: transformed,
      brands: dynamicBrands,
      hasData: transformed.length > 0 && dynamicBrands.length > 0,
      brandColors: colors,
    };
  }, [data]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No position movement detected
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ left: 10, right: 30, top: 20, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.35}
          vertical={false}
        />

        <XAxis
          dataKey="timeStamp"
          axisLine={false}
          tickLine={false}
          tickMargin={14}
          minTickGap={28}
          tick={{
            fill: "hsl(var(--muted-foreground))",
            fontSize: 10,
            fontWeight: 500,
          }}
        />

        <YAxis
          type="number"
          domain={[1, 10]}
          ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          interval={0}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={40}
          tick={{
            fill: "hsl(var(--muted-foreground))",
            fontSize: 10,
            fontWeight: 700,
          }}
          tickFormatter={(v) => `${11 - v}`} // 👈 show real rank
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#9CA3AF", strokeDasharray: "3 3" }}
        />

        {brands.map((brand, index) => {
          const color = brandColors[brand] || BRAND_COLORS[index % BRAND_COLORS.length];
          return (
            <Line
              key={brand}
              type="monotone"
              dataKey={brand}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#fff",
                stroke: color,
                strokeWidth: 2,
              }}
              animationDuration={500}
              name={brand}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
