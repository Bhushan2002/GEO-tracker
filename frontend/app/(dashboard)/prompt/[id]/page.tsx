"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Cell,
    BarChart,
    Bar,
} from "recharts";
import {
    Globe,
    MessageSquare,
    ArrowLeft,
    Calendar,
    BarChart as LucideBarChart,
    PieChart as LucidePieChart,
    LayoutGrid,
    Info,
    Hash,
    Layers,
    TrendingUp,
    ShieldCheck,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    Activity,
    Cpu,
    ChevronRight,
    Search,
    RefreshCw,
    MoreHorizontal,
    Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/api/api";
import { toast } from "sonner";

const COLORS = ["#60A5FA", "#34D399", "#818CF8", "#FACC15", "#FB7185", "#22D3EE"];

export default function PromptDetailsPage({ manualId }: { manualId?: string }) {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const id = manualId || params?.id || searchParams.get("id");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRunBrands, setSelectedRunBrands] = useState<{ id: string, name: string[] } | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get(`/api/prompt-details?id=${id}`);
                setData(response.data);
            } catch (error: any) {
                const errMsg = error.response?.data?.message || error.message || "Failed to load analytics";
                console.error("Failed to load analytics:", error);
                toast.error(errMsg);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [id]);

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-screen bg-white">
            <div className="flex flex-col items-center gap-3 text-foreground/40">
                <Loader className="h-10 w-10 animate-spin text-foreground shrink-0" strokeWidth={1.5} />
                <p className="text-sm font-medium">Gathering intelligence...</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="p-12 text-center bg-white min-h-screen">
            <div className="max-w-md mx-auto space-y-4">
                <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-slate-100">
                    <Info className="h-6 w-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Analytics Unavailable</h3>
                <p className="text-sm text-slate-500">We couldn't find any data for this prompt. Try running an extraction first.</p>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">
                    Go Back
                </Button>
            </div>
        </div>
    );

    const brands = data.brands || [];
    const visibilityTrend = data.visibilityTrend || [];
    const sources = data.sources || [];
    const sourceTypes = data.sourceTypes || [];
    const executionHistory = data.executionHistory || [];

    return (
        <div className="min-h-screen bg-slate-50/20 p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 ease-out">
            {/* Navigation & Header */}
            <div className="space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] group cursor-pointer"
                >
                    <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
                    Back to prompts
                </button>

                <div className="flex flex-col gap-4 border-b border-slate-100 pb-8">
                    <div className="space-y-3 max-w-4xl">
                        <h1 className="text-xl font-medium text-slate-800 tracking-tight leading-relaxed">
                            {data.promptText}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active Intelligence</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.tags?.map((tag: string) => (
                                    <span key={tag} className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 1: Visibility Chart (48%) + Brands Table (52%) */}
            <div className="grid grid-cols-1 xl:grid-cols-[48fr_52fr] gap-6">
                {/* Visibility Trend (~48%) */}
                <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <CardHeader className="border-b border-slate-100 py-3 px-5 bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                            <CardTitle className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Visibility Trend</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 relative bg-white">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={visibilityTrend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '700' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '700' }}
                                    tickFormatter={(v) => `${v}%`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '10px', fontWeight: 600 }}
                                />
                                {brands.slice(0, 5).map((brand: any, index: number) => (
                                    <Line
                                        key={brand.brand_name}
                                        type="monotone"
                                        dataKey={brand.brand_name}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Brands Ranking (~52%) */}
                <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <CardHeader className="border-b border-slate-100 py-3 px-5 bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                            <CardTitle className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Brand Performance</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="flex-1 overflow-auto bg-white">
                        <Table className="border-collapse">
                            <TableHeader className="bg-white">
                                <TableRow className="hover:bg-transparent border-b border-slate-200">
                                    <TableHead className="w-12 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 py-2.5">#</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-5 border-r border-slate-100 py-2.5">Brand</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[18%] border-r border-slate-100 py-2.5">Visibility</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[18%] border-r border-slate-100 py-2.5">Sentiment</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[18%] py-2.5">Position</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brands.map((brand: any, idx: number) => {
                                    const logoUrl = `https://www.google.com/s2/favicons?domain=${brand.brand_name.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;
                                    return (
                                        <TableRow key={idx} className="hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 h-12 group">
                                            <TableCell className="text-center text-slate-400 text-xs font-bold border-r border-slate-100">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell className="border-r border-slate-100 pl-5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                        <img
                                                            src={logoUrl}
                                                            alt=""
                                                            className="h-5 w-5 object-contain"
                                                            onError={(e) => {
                                                                (e.target as any).src = `https://ui-avatars.com/api/?name=${brand.brand_name}&background=f8fafc&color=cbd5e1&font-size=0.5`;
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[13px] font-bold text-slate-800 truncate">{brand.brand_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center border-r border-slate-100">
                                                <span className="font-bold text-slate-900 text-[13px]">{brand.visibility}%</span>
                                            </TableCell>
                                            <TableCell className="border-r border-slate-100">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border min-w-[36px]",
                                                        brand.sentiment >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            brand.sentiment >= 40 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                "bg-rose-50 text-rose-600 border-rose-100"
                                                    )}>
                                                        {brand.sentiment}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-bold text-slate-900 text-[13px]">{brand.position}</span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Row 2: Source Channels (40%) + Sources Table (60%) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Source Channels (Pie Chart 40% -> xl:col-span-5) */}
                <Card className="xl:col-span-5 border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <CardHeader className="border-b border-slate-100 py-3 px-5 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <LucidePieChart className="h-3.5 w-3.5 text-slate-400" />
                            <CardTitle className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Source Channels</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col items-center justify-center flex-1 bg-white">
                        <div className="h-[200px] w-full relative">
                            {/* Center Label - Rendered first to stay behind the chart and tooltip */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none">
                                <span className="text-2xl font-bold text-slate-900 leading-tight">
                                    {sourceTypes.reduce((a: any, b: any) => a + b.value, 0)}
                                </span>
                                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">Total Sources</span>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {sourceTypes.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                strokeWidth={0}
                                                className="outline-none hover:opacity-90 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const total = sourceTypes.reduce((a: any, b: any) => a + b.value, 0);
                                                const percent = Math.round((payload[0].value / total) * 100);
                                                return (
                                                    <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-xl z-50 min-w-[160px]">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                                                                <span className="text-[11px] font-bold text-neutral-100 uppercase tracking-tight">{payload[0].name}</span>
                                                            </div>
                                                            <span className="text-white font-mono text-xs font-bold">{percent}%</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-white mb-1">{payload[0].value.toLocaleString()}</div>
                                                        <div className="text-[10px] text-neutral-400 leading-tight">
                                                            Sources identified within this specific prompt execution.
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-8">
                            {sourceTypes.map((type: any, idx: number) => (
                                <div key={type.name} className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-[10px] font-bold text-slate-500 capitalize">{type.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Sources Table (60% -> xl:col-span-7) */}
                <Card className="xl:col-span-7 border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <CardHeader className="border-b border-slate-100 py-3 px-5 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-slate-400" />
                            <CardTitle className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Top Intelligence Sources</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="flex-1 overflow-auto bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/20 sticky top-0 z-10">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="pl-5 text-[9px] font-bold uppercase text-slate-400 py-2 border-r border-slate-100">Domain</TableHead>
                                    <TableHead className="text-center text-[9px] font-bold uppercase text-slate-400 py-2 border-r border-slate-100">Used</TableHead>
                                    <TableHead className="text-center text-[9px] font-bold uppercase text-slate-400 py-2 border-r border-slate-100">Citations</TableHead>
                                    <TableHead className="text-center text-[9px] font-bold uppercase text-slate-400 py-2">Category</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sources.map((source: any, idx: number) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/50 border-b border-slate-100 h-10 group">
                                        <TableCell className="pl-5 border-r border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`}
                                                        alt=""
                                                        className="h-3.5 w-3.5 object-contain"
                                                        onError={(e) => {
                                                            (e.target as any).style.display = 'none';
                                                            const parent = (e.target as any).parentElement;
                                                            if (parent) {
                                                                parent.classList.add('bg-slate-50');
                                                                parent.innerHTML = `<span class="text-[8px] font-bold text-slate-400">${source.domain.charAt(0)}</span>`;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-bold text-slate-700 text-[12px] truncate max-w-[150px]">{source.domain}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center border-r border-slate-100">
                                            <span className="text-[12px] font-bold text-slate-900">{source.used}%</span>
                                        </TableCell>
                                        <TableCell className="text-center border-r border-slate-100">
                                            <span className="text-[12px] font-medium text-slate-500">{source.citations}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-tighter",
                                                source.type?.toLowerCase() === 'competitor' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                    source.type?.toLowerCase() === 'you' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        source.type?.toLowerCase() === 'ugc' ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                                                            source.type?.toLowerCase() === 'editorial' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                "bg-slate-50 text-slate-600 border-slate-100"
                                            )}>
                                                {source.type || 'Other'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sources.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-xs italic">
                                            No source data available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Row 3: Detailed Execution History Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="border-b border-slate-100 py-4 px-6 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                            <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Execution Registry</CardTitle>
                            <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">Comprehensive audit trail of prompt runs</p>
                        </div>
                    </div>
                </CardHeader>
                <div className="bg-white overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/10 border-b border-slate-100">
                                <TableHead className="text-[10px] font-bold uppercase text-slate-400 pl-6">Timestamp</TableHead>
                                <TableHead className="text-center text-[10px] font-bold uppercase text-slate-400 pl-4 pr-4 border-l border-slate-50">Intelligence Detect</TableHead>
                                <TableHead className="text-center text-[10px] font-bold uppercase text-slate-400 pl-4 pr-4 border-l border-slate-50">Sentiment</TableHead>
                                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase text-slate-400 border-l border-slate-50">Execution Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {executionHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs italic font-medium">
                                        No execution records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                executionHistory.map((run: any) => (
                                    <TableRow key={run.id} className="hover:bg-slate-50/30 border-b border-slate-50 last:border-0 h-14 transition-colors group">
                                        <TableCell className="text-[12px] font-bold text-slate-700 pl-6">
                                            <div className="flex flex-col">
                                                <span>{new Date(run.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="text-[10px] text-slate-400 font-medium font-mono">{new Date(run.date).toLocaleTimeString('en-US', { hour12: false })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center border-l border-slate-50">
                                            <button
                                                onClick={() => setSelectedRunBrands({ id: run.id, name: run.brandsDetected })}
                                                className="flex flex-col items-center gap-1 mx-auto hover:opacity-70 transition-opacity p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer"
                                            >
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {run.brandsDetected?.slice(0, 3).map((brandName: string, i: number) => (
                                                        <div key={i} className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-white border border-slate-100 overflow-hidden">
                                                            <img
                                                                src={`https://www.google.com/s2/favicons?domain=${brandName.toLowerCase().replace(/\s+/g, '')}.com&sz=128`}
                                                                alt={brandName}
                                                                className="h-full w-full object-contain"
                                                                onError={(e) => {
                                                                    (e.target as any).src = `https://ui-avatars.com/api/?name=${brandName}&background=f8fafc&color=cbd5e1&font-size=0.5`;
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                    {run.brandsDetectedCount > 3 && (
                                                        <div className="flex items-center justify-center h-5 w-5 rounded-full ring-2 ring-white bg-slate-50 border border-slate-100 text-[8px] font-bold text-slate-400">
                                                            +{run.brandsDetectedCount - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">
                                                    {run.brandsDetectedCount} Brands Ident
                                                </span>
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-center border-l border-slate-50">
                                            <div className="flex flex-col items-center">
                                                <span className={cn(
                                                    "text-[12px] font-bold",
                                                    run.avgSentiment >= 60 ? "text-emerald-600" :
                                                        run.avgSentiment >= 40 ? "text-amber-600" : "text-rose-600"
                                                )}>
                                                    {run.avgSentiment}
                                                </span>
                                                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">Avg Sentiment</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 border-l border-slate-50">
                                            <div className="flex items-center justify-end gap-2.5">
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                                    run.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                        run.status === 'FAILED' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                            "bg-blue-50 text-blue-600 border border-blue-100"
                                                )}>
                                                    {run.status === 'COMPLETED' ? (
                                                        <><CheckCircle2 className="h-3 w-3" /> Success</>
                                                    ) : run.status === 'FAILED' ? (
                                                        <><XCircle className="h-3 w-3" /> Failure</>
                                                    ) : (
                                                        <><Activity className="h-3 w-3 animate-pulse" /> Active</>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
            {/* Brand List Modal Overlay */}
            {selectedRunBrands && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setSelectedRunBrands(null)} />
                    <Card className="relative w-full max-w-sm border-slate-200 shadow-2xl overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                        <CardHeader className="border-b border-slate-100 py-4 px-6 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                                    <CardTitle className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Detected Brands</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-slate-200"
                                    onClick={() => setSelectedRunBrands(null)}
                                >
                                    <XCircle className="h-4 w-4 text-slate-400" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 max-h-[300px] overflow-auto">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {selectedRunBrands.name.map((brand, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:border-slate-200">
                                        <div className="h-4 w-4 rounded-full bg-white border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden shrink-0 shadow-sm">
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${brand.toLowerCase().replace(/\s+/g, '')}.com&sz=128`}
                                                alt=""
                                                className="h-full w-full object-contain"
                                                onError={(e) => {
                                                    (e.target as any).src = `https://ui-avatars.com/api/?name=${brand}&background=f8fafc&color=cbd5e1&font-size=0.5`;
                                                }}
                                            />
                                        </div>
                                        <span>{brand}</span>
                                    </div>
                                ))}
                                {selectedRunBrands.name.length === 0 && (
                                    <p className="text-center py-4 text-slate-400 text-xs italic w-full">No brands detected in this run</p>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] font-bold uppercase tracking-widest"
                                onClick={() => setSelectedRunBrands(null)}
                            >
                                Close Registry
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
