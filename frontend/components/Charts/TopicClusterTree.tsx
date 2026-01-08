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
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
];

// Custom Content to render the text inside the boxes
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, size } = props;

  // Safety checks
  if (!name || size === undefined) return null;

  const minTextWidth = 80;
  const minTextHeight = 45;
  const showFullText = width > minTextWidth && height > minTextHeight;
  const showNameOnly = width > 60 && height > 30;

  return (
    <g>
      {/* Rounded rectangle with gradient effect */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        ry={6}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: "#fff",
          strokeWidth: 3,
          opacity: 0.95,
        }}
      />
      {/* Subtle inner highlight for depth */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height * 0.3}
        rx={6}
        ry={6}
        style={{
          fill: "rgba(255, 255, 255, 0.15)",
          pointerEvents: "none",
        }}
      />
      
      {/* Text labels */}
      {showFullText && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={14}
            fontWeight="700"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
          >
            {name.length > 20 ? `${name.substring(0, 20)}...` : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.9)"
            fontSize={12}
            fontWeight="600"
          >
            {size.toLocaleString()} users
          </text>
        </>
      )}
      {!showFullText && showNameOnly && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          textAnchor="middle"
          fill="#fff"
          fontSize={11}
          fontWeight="700"
        >
          {name.length > 15 ? `${name.substring(0, 12)}...` : name}
        </text>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-xl z-50 min-w-[180px]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS[payload[0].payload.index % COLORS.length] }}
            />
            <span className="text-[11px] font-bold text-neutral-100 uppercase tracking-tight">
              {data.name}
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {data.size.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400 leading-tight">
            Users visiting this topic cluster from AI sources
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
          <div className="flex flex-col items-center justify-center h-[350px] text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">No topic cluster data available</p>
            <p className="text-xs text-gray-400 mt-1">Data will appear once AI traffic is categorized</p>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={data.map((item, idx) => ({ ...item, index: idx }))}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="transparent"
                content={<CustomizedContent />}
                animationDuration={800}
              >
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
