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

interface SentimentChartProp {
  data: any[];
}

/* ---- Brand Color Palette (Consistent across all charts) ---- */
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
            {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}%
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Line chart visualizing the sentiment score trends for top brands over time.
 */
export function SentimentChart({ data }: SentimentChartProp) {
  const { chartData, top5Brands, hasData, brandColors } = React.useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], top5Brands: [], hasData: false, brandColors: {} };

    const valid = data.some(
      (row) =>
        row.sentiment_score !== undefined &&
        row.sentiment_score !== null
    );
    if (!valid)
      return { chartData: [], top5Brands: [], hasData: false, brandColors: {} };

    const brandTotals: Record<string, { sum: number; count: number }> = {};
    const colors: Record<string, string> = {};
    const brandIndex: Record<string, number> = {};
    let currentIndex = 0;

    data.forEach((row) => {
      const value = parseFloat(row.sentiment_score) || 0;
      if (!brandTotals[row.name]) {
        brandTotals[row.name] = { sum: 0, count: 0 };
        brandIndex[row.name] = currentIndex++;
      }
      brandTotals[row.name].sum += value;
      brandTotals[row.name].count += 1;

      // Store brand color if available
      if (row.color && !colors[row.name]) {
        colors[row.name] = row.color;
      }
    });

    // Assign fallback colors to brands that don't have one
    Object.keys(brandTotals).forEach((brandName) => {
      if (!colors[brandName]) {
        colors[brandName] = BRAND_COLORS[brandIndex[brandName] % BRAND_COLORS.length];
      }
    });

    const top5 = Object.entries(brandTotals)
      .map(([brand, stats]) => ({
        brand,
        avg: stats.sum / stats.count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 7)
      .map((b) => b.brand);

    const map: Record<string, any> = {};
    data.forEach((row) => {
      if (!top5.includes(row.name)) return;
      if (!map[row.timeStamp]) {
        map[row.timeStamp] = { timeStamp: row.timeStamp };
      }
      const rawScore = parseFloat(row.sentiment_score) || 0;
      const normalizedScore = rawScore <= 10 ? rawScore * 10 : rawScore;
      map[row.timeStamp][row.name] = Math.min(100, normalizedScore);
    });

    const transformed = Object.values(map).sort((a: any, b: any) => {
      const da = new Date(a.timeStamp.split("/").reverse().join("-"));
      const db = new Date(b.timeStamp.split("/").reverse().join("-"));
      return da.getTime() - db.getTime();
    });

    return { chartData: transformed, top5Brands: top5, hasData: true, brandColors: colors };
  }, [data]);

  if (!hasData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No sentiment data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="2 6"
          stroke="hsl(var(--border))"
          opacity={0.25}
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
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(val) => `${val}%`}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          domain={[0, 100]}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: "#9CA3AF",
            strokeDasharray: "3 3",
          }}
        />

        {top5Brands.map((brand, index) => {
          const color = brandColors[brand] || BRAND_COLORS[index % BRAND_COLORS.length];
          const isPrimary = index < 3;

          return (
            <Line
              key={brand}
              type="monotone"
              dataKey={brand}
              stroke={color}
              strokeWidth={isPrimary ? 3 : 1.8}
              strokeOpacity={isPrimary ? 1 : 0.35}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#fff",
                stroke: color,
                strokeWidth: 2,
              }}
              animationDuration={800}
              name={brand}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
