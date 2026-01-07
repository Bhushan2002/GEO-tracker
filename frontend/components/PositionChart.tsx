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

    /* ---- Top 6 brands ---- */
    const topBrands = Object.entries(stats)
      .map(([brand, s]) => ({ brand, avg: s.sum / s.count }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 6)
      .map((b) => b.brand);

    /* ---- Build timeseries ---- */
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

      map[row.timeStamp].__rawRanks[row.name] = rank;

      // 👇 UI-ONLY micro offset to avoid visual overlap
      const brandIndex = topBrands.indexOf(row.name);
      const visualOffset = brandIndex * 0.06;

      map[row.timeStamp][row.name] =
        rank == null ? null : rank + visualOffset;
    });

    /* ---- Sort dates (dd/mm/yyyy safe) ---- */
    const transformed = Object.values(map).sort((a: any, b: any) => {
      const da = new Date(a.timeStamp.split("/").reverse().join("-"));
      const db = new Date(b.timeStamp.split("/").reverse().join("-"));
      return da.getTime() - db.getTime();
    });

    return {
      chartData: transformed,
      brands: topBrands,
      hasData: transformed.length > 0,
    };
  }, [data]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No position data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ left: -10, right: 30, top: 10, bottom: 10 }}
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
            fontSize: 11,
            fontWeight: 500,
          }}
        />

        <YAxis
          reversed
          domain={[1, 6.4]}
          ticks={[1, 2, 3, 4, 5, 6]}
          axisLine={false}
          tickLine={false}
          width={40}
          tick={{
            fill: "hsl(var(--muted-foreground))",
            fontSize: 11,
            fontWeight: 600,
          }}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#9CA3AF", strokeDasharray: "3 3" }}
        />

        {brands.map((brand, index) => (
          <Line
            key={brand}
            type="stepAfter"
            dataKey={brand}
            stroke={BRAND_COLORS[index]}
            strokeWidth={2}
            connectNulls={false}
            dot={{
              r: 3,
              fill: "#fff",
              stroke: BRAND_COLORS[index],
              strokeWidth: 1.6,
            }}
            activeDot={{
              r: 4,
              fill: "#fff",
              stroke: BRAND_COLORS[index],
              strokeWidth: 1.8,
            }}
            animationDuration={500}
            name={brand}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
