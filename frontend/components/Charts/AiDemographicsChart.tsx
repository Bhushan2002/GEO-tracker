"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AiDemographicsChartProps {
  data: any[];
}

export function AiDemographicsChart({ data }: AiDemographicsChartProps) {
  // Consistent colors for each AI model
  const MODEL_COLORS: Record<string, string> = {
    ChatGPT: "#10b981", // Emerald
    Perplexity: "#3b82f6", // Blue
    Copilot: "#f59e0b", // Amber
    Claude: "#8b5cf6", // Violet
    Gemini: "#ef4444", // Red
  };

  const formatCountry = (value: string) => {
    // Simple overrides for common long names
    if (value === "United States") return "USA";
    if (value === "United Kingdom") return "UK";
    if (value.length > 12) return `${value.substring(0, 10)}..`;
    return value;
  };

  return (
    <Card className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
        
          <div>
            <CardTitle className="font-bold text-xs uppercase tracking-wider text-slate-800">
              AI Model Usage by Country
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 font-medium mt-0.5">
              Traffic distribution across top regions
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {data.length === 0 ? (
          <div className="flex h-[320px] w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            No demographic data available
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.8}
                />
                <XAxis
                  dataKey="country"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                  tickFormatter={formatCountry}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickMargin={10}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc", opacity: 0.8 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ padding: "2px 0" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: "24px", paddingBottom: "4px" }}
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-slate-600 ml-1 mr-3">
                      {value}
                    </span>
                  )}
                />

                {/* Render a bar for each known model */}
                {Object.keys(MODEL_COLORS).map((model) => (
                  <Bar
                    key={model}
                    dataKey={model}
                    stackId="a"
                    fill={MODEL_COLORS[model]}
                    stroke={MODEL_COLORS[model]}
                    radius={[0, 0, 0, 0]}
                    barSize={24}
                    className="hover:opacity-90 transition-opacity cursor-pointer"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
