"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  mentions: {
    label: "Mentions",
    color: "hsl(221, 83%, 53%)",
  },
  prominence: {
    label: "Prominence Score",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig;

interface VisibilityChartProp {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function VisibilityChart({ data }: VisibilityChartProp) {
  return (
    <div className="w-full h-full">
      <ChartContainer config={chartConfig} className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorProminence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickMargin={12}
              interval={0}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              angle={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} />
            <ChartLegend 
              content={<ChartLegendContent />}
              wrapperStyle={{ paddingTop: "20px" }}
            />

            {/* Prominence Area (behind) */}
            <Area
              dataKey="prominence"
              type="monotone"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={3}
              fill="url(#colorProminence)"
              fillOpacity={1}
              dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />

            {/* Mentions Area (front) */}
            <Area
              dataKey="mentions"
              type="monotone"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={3}
              fill="url(#colorMentions)"
              fillOpacity={1}
              dot={{ fill: "hsl(221, 83%, 53%)", strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
