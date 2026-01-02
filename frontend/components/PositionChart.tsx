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

interface PositionChartProp {
  data: any[];
}

/* ---- Semi-Vibrant Professional Colors ---- */
const BRAND_COLORS = [
  "#60A5FA", // Blue 400
  "#34D399", // Emerald 400
  "#818CF8", // Indigo 400
  "#22D3EE", // Cyan 400
  "#FACC15", // Amber 400
  "#FB7185", // Rose 400
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

export function PositionChart({ data }: PositionChartProp) {
  const { chartData, top5Brands, hasData } = React.useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], top5Brands: [], hasData: false };

    const valid = data.some(
      (row) => row.lastRank !== undefined && row.lastRank !== null
    );
    if (!valid)
      return { chartData: [], top5Brands: [], hasData: false };

    const brandTotals: Record<string, { sum: number; count: number }> = {};

    data.forEach((row) => {
      const value = parseFloat(row.lastRank) || 0;
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
      .sort((a, b) => a.avg - b.avg) // lower rank is better
      .slice(0, 6)
      .map((b) => b.brand);

    const map: Record<string, any> = {};
    data.forEach((row) => {
      if (!top5.includes(row.name)) return;
      if (!map[row.timeStamp]) {
        map[row.timeStamp] = { timeStamp: row.timeStamp };
      }
      map[row.timeStamp][row.name] =
        parseFloat(row.lastRank) || 0;
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
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No position data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ left: -20, right: 10, top: 20, bottom: 0 }}
      >
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
          reversed
          domain={[0.8, 6.2]}
          ticks={[1, 2, 3, 4, 5, 6]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />

        {/* ---- Color-Matched Tooltip ---- */}
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
            type="monotone"
            dataKey={brand}
            stroke={BRAND_COLORS[index]}
            strokeWidth={2}
            dot={{
              r: 2.4,
              strokeWidth: 1.6,
              fill: "white",
              stroke: BRAND_COLORS[index],
            }}
            activeDot={{
              r: 3.4,
              strokeWidth: 1.6,
              fill: "white",
              stroke: BRAND_COLORS[index],
            }}
            isAnimationActive
            animationDuration={650}
            name={brand}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
