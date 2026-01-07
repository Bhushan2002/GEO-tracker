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
} from "recharts";

interface SourceUsageChartProps {
    data: any[]; // Array of points { timeStamp: string, source1: percentage, source2: percentage, ... }
    sources: string[]; // List of source names to draw lines for
}

const COLORS = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#8B5CF6", // violet-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#06B6D4", // cyan-500
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200 min-w-[140px]">
            <div className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-50">
                {label}
            </div>
            <div className="space-y-2">
                {payload.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-600 font-medium text-[11px] truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 text-[11px]">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function SourceUsageChart({ data, sources }: SourceUsageChartProps) {
    if (!data || data.length === 0 || !sources || sources.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic font-medium">
                No usage data available for the selected sources
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
            >
                <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#F1F5F9"
                    vertical={false}
                />

                <XAxis
                    dataKey="timeStamp"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                />

                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                    domain={[0, 100]}
                />

                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#F1F5F9", strokeWidth: 2 }}
                    isAnimationActive={false}
                />

                {sources.map((source, index) => (
                    <Line
                        key={source}
                        type="monotone"
                        dataKey={source}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                            r: 5,
                            strokeWidth: 2.5,
                            fill: "white",
                            stroke: COLORS[index % COLORS.length],
                        }}
                        animationDuration={1500}
                        name={source}
                        connectNulls
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
