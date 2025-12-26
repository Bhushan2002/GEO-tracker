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
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VisibilityChartProp {
  data: any[];
}

const BRAND_COLORS = [
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#f97316", // orange
  "#10b981", // green
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#ef4444", // red
  "#14b8a6", // teal
];

export function VisibilityChart({ data }: VisibilityChartProp) {
  // Extract brand names from the data (all keys except timeStamp/date)
  const brandNames = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    return Object.keys(firstRow).filter((key) => key !== "timeStamp" && key !== "date");
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Brand Visibility Over Time</CardTitle>
        <CardDescription>Tracking brand mentions and prominence</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="timeStamp"
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickMargin={12}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
            dataKey={"name"}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickMargin={8}
              // tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
            />

            {/* Dynamic lines for each brand */}
            {brandNames.map((brand, index) => (
              <Line
                key={brand}
                dataKey={brand}
                type="monotone"
                stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, stroke: BRAND_COLORS[index % BRAND_COLORS.length] }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name={brand}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
