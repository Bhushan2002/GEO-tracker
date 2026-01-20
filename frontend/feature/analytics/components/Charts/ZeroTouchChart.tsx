"use client";

import { Info, Loader2, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { TooltipContent, TooltipTrigger, Tooltip as InfoTooltip } from "../../../../components/ui/tooltip";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface ZeroTouchChartProps {
    data: any[];
    loading: boolean;
    formatDate: (value: any) => string;
}

export function ZeroTouchChart({ data, loading, formatDate }: ZeroTouchChartProps) {
    return (
        <div>
            <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100  px-5 ">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Zero Touch Attribution
                            </CardTitle>
                            <CardDescription className="text-[10px] text-slate-500 font-medium">
                                Brand awareness & indirect influence
                            </CardDescription>
                        </div>
                        <InfoTooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Tracks impressions and brand searches where
                                users don't directly click but are influenced by
                                brand awareness
                            </TooltipContent>
                        </InfoTooltip>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart
                                data={data}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorImpressions"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#9333ea"
                                            stopOpacity={0.1}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#9333ea"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatDate}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.95)",
                                        border: "none",
                                        borderRadius: "8px",
                                        boxShadow:
                                            "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        padding: "12px",
                                    }}
                                    cursor={{
                                        stroke: "#cbd5e1",
                                        strokeWidth: 1,
                                        strokeDasharray: "4 4",
                                    }}
                                    labelFormatter={formatDate}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Line
                                    type="monotone"
                                    dataKey="impressions"
                                    stroke="#9333ea"
                                    strokeWidth={3}
                                    name="Impressions"
                                    dot={{
                                        fill: "#9333ea",
                                        r: 0,
                                        strokeWidth: 0,
                                        stroke: "#fff",
                                    }}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                    fill="url(#colorImpressions)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="brandSearches"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    name="Brand Searches"
                                    dot={{
                                        fill: "#ec4899",
                                        r: 0,
                                        strokeWidth: 0,
                                        stroke: "#fff",
                                    }}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                            <Users className="h-10 w-10 mb-3 opacity-20" />
                            <p className="font-medium">
                                No zero touch data available
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}