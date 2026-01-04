"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/api/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, Download, ExternalLink, Globe, MessageSquare, ShieldCheck } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { cn } from "@/lib/utils";

interface PromptAnalytics {
    promptText: string;
    tags: string[];
    visibilityTrend: any[]; // Dynamic keys: { date: string, "Brand A": 50, "Brand B": 30 }
    brands: {
        _id: string;
        brand_name: string;
        visibility: number;
        sentiment: number;
        position: number;
    }[];
    sources: {
        domain: string;
        citations: number;
        type: string;
        used: number;
        avgCitations: string;
    }[];
    sourceTypes: { name: string; value: number }[];
    runs: { createdAt: string }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function PromptDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<PromptAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            setLoading(true);
            api.get<PromptAnalytics>(`/api/prompt-analytics/${params.id}`)
                .then((res) => setData(res.data))
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-800 animate-spin rounded-full" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold text-slate-800">Prompt not found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/[0.3] p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="hover:text-slate-900 cursor-pointer transition-colors" onClick={() => router.push('/prompt')}>Prompts</span>
                    <ChevronLeft className="h-2.5 w-2.5 rotate-180 text-slate-400" />
                    <span className="text-slate-900">Detailed View</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                            <MessageSquare className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 leading-tight max-w-4xl tracking-tight">
                                "{data.promptText}"
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                    "bg-emerald-50 text-emerald-700 border-emerald-100"
                                )}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                                {data.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                    </div>
                </div>
            </div>

            {/* Row 1: Visibility Chart + Brands Table */}
            <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-[420px]">
                {/* Visibility Chart (60%) */}
                <Card className="flex-[3] border-slate-200 shadow-sm overflow-hidden flex flex-col h-[420px] xl:h-full">
                    <CardHeader className="border-b border-slate-100 py-3 px-6 bg-slate-50/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-slate-400" />
                                <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                                    Visibility Trend
                                </CardTitle>
                                <span className="text-slate-300 mx-1">•</span>
                                <p className="text-[10px] text-slate-500 font-medium italic">Share of voice tracked over 30 days</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 bg-white relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.visibilityTrend} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                    dy={10}
                                    padding={{ left: 20, right: 20 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                    tickFormatter={(v) => `${v}%`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                    cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                                    itemSorter={(item) => (item.value as number) * -1}
                                />
                                {data.brands.slice(0, 6).map((brand, index) => (
                                    <Line
                                        key={brand._id}
                                        type="monotone"
                                        dataKey={brand.brand_name}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Brands Table (40%) */}
                <Card className="flex-[2] border-slate-200 shadow-sm overflow-hidden flex flex-col h-[420px] xl:h-full">
                    <CardHeader className="border-b border-slate-100 py-3 px-6 bg-slate-50/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                                    Brands Ranking
                                </CardTitle>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Displaying top performers</p>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto bg-white">
                        <Table className="border-collapse">
                            <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="hover:bg-transparent border-b border-slate-200">
                                    <TableHead className="w-[10%] text-center text-[10px] font-bold uppercase text-slate-500 border-r border-slate-100">#</TableHead>
                                    <TableHead className="w-[40%] text-[10px] font-bold uppercase text-slate-500 px-4 border-r border-slate-100">Brand</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase text-slate-500 border-r border-slate-100">Visibility</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase text-slate-500 border-r border-slate-100">Sentiment</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase text-slate-500">Position</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.brands.map((brand, idx) => (
                                    <TableRow key={brand._id} className="hover:bg-slate-50/30 border-b border-slate-100 last:border-0 h-12">
                                        <TableCell className="text-center text-xs font-bold text-slate-400 border-r border-slate-100">{idx + 1}</TableCell>
                                        <TableCell className="px-4 border-r border-slate-100">
                                            <div className="flex items-center gap-3">
                                                {idx < 6 && (
                                                    <div className="h-4 w-1 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx] }} />
                                                )}
                                                <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${brand.brand_name.toLowerCase().replace(/\s+/g, '')}.com&sz=64`}
                                                        alt=""
                                                        className="h-full w-full object-contain"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${brand.brand_name}&background=f8fafc&color=64748b&font-size=0.5`;
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-bold text-xs text-slate-800 truncate">{brand.brand_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center border-r border-slate-100 px-2">
                                            <span className="text-xs font-bold text-slate-900">{brand.visibility}%</span>
                                        </TableCell>
                                        <TableCell className="text-center border-r border-slate-100 px-2">
                                            <div className="flex justify-center">
                                                <span className={cn(
                                                    "text-[11px] font-bold px-3 py-1 rounded-md border",
                                                    brand.sentiment >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        brand.sentiment >= 40 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                            "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    {brand.sentiment}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-bold text-slate-900">
                                            {brand.position}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Row 2: Sources Type Donut + Top Sources List */}
            <div className="flex flex-col xl:flex-row gap-6 mt-8">
                {/* Sources Type Chart (33%) */}
                <Card className="flex-1 border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <CardHeader className="border-b border-slate-100 py-3 px-6 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Sources Type</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white flex flex-col items-center justify-center h-full">
                        <div className="h-[180px] w-full relative">
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none">
                                <span className="text-2xl font-bold text-slate-900">{data.sources.reduce((a, b) => a + b.citations, 0)}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Total Citations</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.sourceTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.sourceTypes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
                            {data.sourceTypes.map((type, idx) => (
                                <div key={type.name} className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-xs font-medium text-slate-500 capitalize">{type.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Sources Table (66%) */}
                <Card className="flex-[2] border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <CardHeader className="border-b border-slate-100 py-3 px-6 bg-slate-50/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                                    Top Sources
                                </CardTitle>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Domain citations and usage</p>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="bg-white flex-1 overflow-y-auto">
                        <Table className="border-collapse">
                            <TableHeader className="bg-slate-50/10">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="w-[40%] text-[10px] font-bold uppercase pl-6 text-slate-500 border-r border-slate-100">Domain</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase text-slate-500 border-r border-slate-100">Used</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase text-slate-500 border-r border-slate-100">Avg Citrus</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase text-slate-500">Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.sources.map((source, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/30 border-b border-slate-100 h-12">
                                        <TableCell className="pl-6 border-r border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=64`}
                                                        alt=""
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <a href={`https://${source.domain}`} target="_blank" className="font-bold text-xs text-slate-800 hover:text-blue-600 hover:underline truncate">
                                                    {source.domain}
                                                </a>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center border-r border-slate-100">
                                            <span className="text-xs font-bold text-slate-900">{source.used}%</span>
                                        </TableCell>
                                        <TableCell className="text-center border-r border-slate-100">
                                            <span className="text-xs font-bold text-slate-900">{source.avgCitations}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize",
                                                    source.type.toLowerCase() === 'competitor' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                        source.type.toLowerCase() === 'corporate' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                            source.type.toLowerCase() === 'editorial' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                "bg-slate-50 text-slate-600 border-slate-100"
                                                )}>
                                                    {source.type}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.sources.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-xs text-slate-400 italic">
                                            No sources cited yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Row 3: Execution History */}
            <div className="mt-8">
                <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-slate-100 py-3 px-6 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                                    Execution History
                                </CardTitle>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Log of all scheduled runs for this prompt</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                                        <TableHead className="pl-6 text-[10px] font-bold uppercase text-slate-500">Run Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500">Run Time</TableHead>
                                        <TableHead className="text-right pr-6 text-[10px] font-bold uppercase text-slate-500">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...data.runs].reverse().map((run, idx) => {
                                        const d = new Date(run.createdAt);
                                        return (
                                            <TableRow key={idx} className="hover:bg-slate-50/30 border-b border-slate-100 last:border-0 h-10">
                                                <TableCell className="pl-6 text-xs font-medium text-slate-700">
                                                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-slate-500">
                                                    {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                                        Success
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {data.runs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-xs text-slate-400 italic">
                                                No execution history found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
