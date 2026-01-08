"use client";

import React from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TopicClustersTreemapProps {
  data: { name: string; size: number }[];
}

const COLORS = [
  "#8884d8",
  "#83a6ed",
  "#8dd1e1",
  "#82ca9d",
  "#a4de6c",
  "#d0ed57",
  "#ffc658",
  "#ff8042",
];

// Custom Content to render the text inside the boxes
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, size } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: "#fff",
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
        >
          {name}
        </text>
      )}
      {width > 50 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 16}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
        >
          {size} users
        </text>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-2 rounded shadow-sm text-xs">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-gray-500">{payload[0].value} Users</p>
      </div>
    );
  }
  return null;
};

interface TopicClustersTreemapProps {
  data: { name: string; size: number }[];
}

/**
 * Treemap visualization of topic clusters showing user interest distribution.
 */
export function TopicClustersTreemap({ data }: TopicClustersTreemapProps) {
  return (
    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 ">
        <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
          Topic Clusters
        </CardTitle>
        <CardDescription className="text-[10px] text-slate-500 font-medium">
          Which content sections attract the most AI traffic?
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No topic data available
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={data}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomizedContent />}
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
