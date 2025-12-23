"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  users: {
    label: "Users",
    color: "#8b5cf6",
  },
} satisfies ChartConfig;

interface WebsiteTrafficChartProps {
  data: any[];
}

export function WebsiteTrafficChart({ data }: WebsiteTrafficChartProps) {
  return (
    <Card className="shadow-sm border bg-white h-[350px] w-[400px]">
      <CardHeader>
        <CardTitle>Website Traffic Overview</CardTitle>
        <CardDescription>
          Total users per page path
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
          <BarChart
            data={data}
            margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
          >
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
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={{ fill: "#f3f4f6", opacity: 0.3 }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="users"
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
