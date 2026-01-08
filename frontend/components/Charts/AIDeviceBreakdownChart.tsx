"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader } from "lucide-react";

interface AIDeviceBreakdownChartProps {
  data: any[];
  loading?: boolean;
}

export function AIDeviceBreakdownChart({ data, loading }: AIDeviceBreakdownChartProps) {
  // Safe color palette for devices
  const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="col-span-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100  px-5 ">
                    <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                      Breakdown of Devices Used by AI Visitors
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-medium">
                      Mobile vs Desktop split for AI-driven sessions
                    </CardDescription>
                  </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No device data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
