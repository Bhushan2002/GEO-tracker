import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Loader2, ExternalLink, Smartphone } from "lucide-react";

interface AiOverviewStatsProps {
    pages: any[];
    devices: any[];
    loading: boolean;
}

export function AiOverviewStats({ pages, devices, loading }: AiOverviewStatsProps) {
    const COLORS = ["#9333ea", "#ec4899", "#3b82f6", "#10b981"];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. Top Pages Table (Takes up 2/3 space) */}
            <Card className="lg:col-span-2 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 px-5">
                    <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                        Top AI Overview Content
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-medium">
                        Pages where users clicked the "AI Overview" citation link
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : pages.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="w-[60%] text-xs font-semibold">Page Title / URL</TableHead>
                                    <TableHead className="text-right text-xs font-semibold">Clicks</TableHead>
                                    <TableHead className="text-right text-xs font-semibold">Share</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map((page, i) => {
                                    const total = pages.reduce((acc, curr) => acc + curr.clicks, 0);
                                    const percent = ((page.clicks / total) * 100).toFixed(1);
                                    return (
                                        <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-medium text-slate-900 line-clamp-1">
                                                        {page.title}
                                                    </span>
                                                    <a
                                                        href={page.path.startsWith('http') ? page.path : `https://${page.path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-slate-500 flex items-center gap-1 hover:text-blue-500 hover:underline"
                                                    >
                                                        {page.path} <ExternalLink className="h-2 w-2" />
                                                    </a>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-700">
                                                {page.clicks}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-slate-500">
                                                {percent}%
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <p>No AI Overview clicks recorded yet.</p>
                            <p className="text-xs mt-1">Wait for GTM to collect data.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Device Breakdown (Takes up 1/3 space) */}
            <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 px-5">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-500" />
                        <div>
                            <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Device Breakdown
                            </CardTitle>
                            <CardDescription className="text-[10px] text-slate-500 font-medium">
                                Platform distribution
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : devices.length > 0 ? (
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={devices}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {devices.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <p>No device data available</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}