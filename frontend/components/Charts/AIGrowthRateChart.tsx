"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Loader } from "lucide-react";
import InfoButton from "../InfoButton";

interface AIGrowthRateChartProps {
  data: any[];
  loading?: boolean;
}

/**
 * Line chart visualizing the month-over-month growth rate of AI traffic.
 * Includes a linear regression trendline.
 */
export function AIGrowthRateChart({ data, loading }: AIGrowthRateChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Calculate Trendline (Simple Linear Regression)
    // We only use indices (0, 1, 2...) for x-axis in regression calculation
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point.growth;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((point, index) => ({
      ...point,
      trend: (slope * index + intercept).toFixed(1),
    }));
  }, [data]);

  return (
    <Card className="col-span-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 ">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              AI Traffic Growth Rate
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-500 font-medium">
              Month-by-month percentage growth of AI sessions
            </CardDescription>
          </div>
          <InfoButton content=" Month-over-month growth rate of AI traffic with trend analysis showing growth trajectory"/>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                unit="%"
                label={{
                  value: "Growth %",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#6b7280" },
                }}
              />
              <Tooltip
                formatter={(value: any, name: string) => [
                  `${value}%`,
                  name === "growth" ? "Growth Rate" : "Trend",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="growth"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Growth Rate"
                dot={{ fill: "#8b5cf6", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#10b981"
                strokeWidth={2}
                name="Trendline"
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No growth data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
