"use client";

import * as React from "react";
import {
  Line,
  LineChart,
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
    <Card className="pt-0 shadow-sm border  rounded-xl bg-white">
      <CardHeader className="flex flex-col gap-1 border-b py-5">
        <CardTitle>Visibility Momentum</CardTitle>
        <CardDescription>
          Tracking brand mentions and recommendation strength
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            
            {/* Mentions Line */}
            <Line
              dataKey="mentions"
              type="monotone"
              stroke="var(--color-mentions)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-mentions)" }}
              activeDot={{ r: 6 }}
            />
            
            {/* Prominence Line */}
            <Line
              dataKey="prominence"
              type="monotone"
              stroke="var(--color-prominence)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-prominence)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}