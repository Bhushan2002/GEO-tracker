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

/* ---------- Colors ---------- */
const BRAND_COLORS = [
  "#60A5FA", // Blue
  "#34D399", // Emerald
  "#818CF8", // Indigo
  "#22D3EE", // Cyan
  "#FACC15", // Amber
  "#FB7185", // Rose
  "#A78BFA", // Violet
  "#F472B6", // Pink
  "#FB923C", // Orange
  "#94A3B8", // Slate
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

export function PositionChart({ data }: PositionChartProp) {
  const { chartData, brands, hasData } = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], brands: [], hasData: false };
    }

    /* ---- Compute avg rank per brand ---- */
    const stats: Record<string, { sum: number; count: number }> = {};

    data.forEach((row) => {
      if (row.lastRank == null) return;
      const rank = Number(row.lastRank);
      if (Number.isNaN(rank)) return;

      stats[row.name] ??= { sum: 0, count: 0 };
      stats[row.name].sum += rank;
      stats[row.name].count += 1;
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

        {brands.map((brand, index) => (
          <Line
            key={brand}
            type="monotone"
            dataKey={brand}
            stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#fff",
              stroke: BRAND_COLORS[index % BRAND_COLORS.length],
              strokeWidth: 2,
            }}
            animationDuration={500}
            name={brand}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
