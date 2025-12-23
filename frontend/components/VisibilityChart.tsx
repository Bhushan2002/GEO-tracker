"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  mentions: {
    label: "Mentions",
    color: "#2563eb",
  },
  prominence: {
    label: "Prominence",
    color: "#10b981",
  },
} satisfies ChartConfig;

interface VisibilityChartProp {
  data: any[];
}

export function VisibilityChart({ data }: VisibilityChartProp) {
  return (
    <Card className="pt-0 shadow-sm border   bg-white w-[600px]">
      <CardContent className="px-2 pt-4 sm:px-6 ">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] ">
          <AreaChart
            data={data}
            margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProminence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={0}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />

            {/* Mentions Area */}
            <Area
              dataKey="mentions"
              type="monotone"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#colorMentions)"
              fillOpacity={1}
            />

            {/* Prominence Area */}
            <Area
              dataKey="prominence"
              type="monotone"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorProminence)"
              fillOpacity={1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
