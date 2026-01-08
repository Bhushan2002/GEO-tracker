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

interface VisibilityChartProp {
  data: any[];
}

/* ---- Refined Soft Colors (Professional Pastels) ---- */
const BRAND_COLORS = [
  "#60A5FA", // Blue 400 – clear, confident
  "#34D399", // Emerald 400 – fresh, positive
  "#818CF8", // Indigo 400 – modern, premium
  "#22D3EE", // Cyan 400 – clean, techy
  "#FACC15", // Amber 400 – attention without noise
  "#FB7185", // Rose 400 – subtle contrast
];


/* ---------- Custom Tooltip ---------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "#E5E7EB",
        border: "1px solid #D1D5DB",
        borderRadius: "10px",
        padding: "10px 12px",
        fontSize: "12px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
        minWidth: "180px",
      }}
    >
      {/* Date */}
      <div
        style={{
          fontWeight: 600,
          color: "#111827",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      {/* Brand rows */}
      {payload.map((item: any) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {/* Color indicator (matches line) */}
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: item.stroke,
              }}
            />

            <span style={{ color: "#111827" }}>
              {item.name}
            </span>
          </div>

          <span
            style={{
              fontWeight: 500,
              color: "#111827",
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function VisibilityChart({ data }: VisibilityChartProp) {
  const { chartData, top5Brands, hasData } = React.useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], top5Brands: [], hasData: false };

    const valid = data.some(
      (row) => row.mentions !== undefined && row.mentions !== null
    );
    if (!valid)
      return { chartData: [], top5Brands: [], hasData: false };

    const brandTotals: Record<string, { sum: number; count: number }> = {};

    data.forEach((row) => {
      const value = parseFloat(row.mentions) || 0;
      if (!brandTotals[row.name]) {
        brandTotals[row.name] = { sum: 0, count: 0 };
      }
      brandTotals[row.name].sum += value;
      brandTotals[row.name].count += 1;
    });

    const top5 = Object.entries(brandTotals)
      .map(([brand, stats]) => ({
        brand,
        avg: stats.sum / stats.count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
      .map((b) => b.brand);

    const map: Record<string, any> = {};
    data.forEach((row) => {
      if (!top5.includes(row.name)) return;
      if (!map[row.timeStamp]) {
        map[row.timeStamp] = { timeStamp: row.timeStamp };
      }
      map[row.timeStamp][row.name] = parseFloat(row.mentions) || 0;
    });

    const transformed = Object.values(map).sort((a: any, b: any) => {
      const da = new Date(a.timeStamp.split("/").reverse().join("-"));
      const db = new Date(b.timeStamp.split("/").reverse().join("-"));
      return da.getTime() - db.getTime();
    });

    return { chartData: transformed, top5Brands: top5, hasData: true };
  }, [data]);

  if (!hasData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        No visibility data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
      >
        {/* -------- Professional Grid -------- */}
        <CartesianGrid
          strokeDasharray="2 6"
          stroke="hsl(var(--border))"
          opacity={0.28}
        />

        <XAxis
          dataKey="timeStamp"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          minTickGap={20}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: "#9CA3AF",
            strokeDasharray: "3 3",
          }}
        />

        {top5Brands.map((brand, index) => (
          <Line
            key={brand}
            type="natural"
            dataKey={brand}
            stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              fill: "white",
              stroke: BRAND_COLORS[index % BRAND_COLORS.length],
            }}
            isAnimationActive
            animationDuration={1000}
            name={brand}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
