"use client";

import React, { useState } from "react";
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import {
    Bot,
    Loader,
    TrendingUp,
    Activity,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    Search,
    Filter,
    Sparkles,
    Target,
    Zap
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Cell,
    PieChart,
    Pie,
    Legend,
    LabelList,
    Sector,
    Tooltip as RechartsTooltip
} from "recharts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

type ModelMetrics = {
    totalRuns: number;
    avgLatency: number;
    avgSentiment: number;
    brandPresence: number;
    brandsPerRun: string;
};

type ModelData = {
    family: string;
    metrics: ModelMetrics;
    topSources: { domain: string, count: number }[];
    allSources?: { domain: string, count: number }[];
    sentimentDistribution: { positive: number, neutral: number, negative: number };
    recentActivity: any[];
    trends: {
        presence: { value: string, direction: 'up' | 'down' | 'flat' };
        sentiment: { value: string, direction: 'up' | 'down' | 'flat' };
        latency: { value: string, direction: 'up' | 'down' | 'flat' };
        activity: { value: string, direction: 'up' | 'down' | 'flat' };
    };
    insights: {
        presence: string;
        sentiment: string;
        latency: string;
        activity: string;
    };
};

import { useDashboardData } from "@/lib/contexts/dashboard-data-context";

/**
 * Models analytics page.
 * Visualizes performance metrics, sentiment, and source citations for different AI models.
 */
export default function ModelsPage() {
    const { modelsAnalytics, isLoading } = useDashboardData();
    const [selectedModel, setSelectedModel] = useState<string>("ChatGPT");
    const [selectedActivity, setSelectedActivity] = useState<any>(null);

    const activeData = (modelsAnalytics as ModelData[]).find(d => d.family === selectedModel);

    // Prepare chart data
    const sentimentChartData = activeData ? [
        { name: "Positive", value: activeData.sentimentDistribution.positive, color: "#10B981" },
        { name: "Neutral", value: activeData.sentimentDistribution.neutral, color: "#6B7280" },
        { name: "Negative", value: activeData.sentimentDistribution.negative, color: "#EF4444" }
    ].filter(d => d.value > 0) : [];

    const sourceChartData = activeData ? activeData.topSources : [];
    const totalCitations = activeData ? activeData.allSources?.reduce((acc, curr) => acc + curr.count, 0) || 1 : 1;

    const MODELS = ["ChatGPT", "Gemini", "Claude"];

    // Premium Gradients
    const GRADIENTS = [
        { id: "grad1", from: "#3B82F6", to: "#60A5FA" }, // Blue
        { id: "grad2", from: "#8B5CF6", to: "#A78BFA" }, // Violet
        { id: "grad3", from: "#10B981", to: "#34D399" }, // Emerald 
        { id: "grad4", from: "#F59E0B", to: "#FBBF24" }, // Amber
        { id: "grad5", from: "#6366F1", to: "#818CF8" }, // Indigo
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-foreground/40">
                <Loader className="h-10 w-10 animate-spin text-foreground shrink-0" strokeWidth={1.5} />
                <p className="text-sm font-medium">Crunching analytics...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 animate-in fade-in duration-500 ease-out">
            <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-8">

                {/* 1. Header Section */}
                <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] -mx-6 -mt-6 mb-8">
                    <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Model Intelligence</h1>
                                <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                                    Analyze how different AI engines perceive and verify your brand.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-1.5 rounded-xl flex items-center gap-1 border border-slate-100">
                            {MODELS.map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setSelectedModel(model)}
                                    className={cn(
                                        "px-4 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 min-w-[80px]",
                                        selectedModel === model
                                            ? "bg-white shadow-sm text-slate-900 border border-slate-200 scale-100"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {model}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {!activeData ? (
                    <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                        <Bot className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No data available for {selectedModel} yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Run some prompts using this model to see analytics.</p>
                    </div>
                ) : (
                    <>
                        {/* 2. KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                title="Brand Presence"
                                value={`${activeData.metrics.brandPresence}%`}
                                label="Visibility Rate"
                                icon={Target}
                                color="text-slate-900"
                                bg="bg-white border-2 border-slate-100"
                                trend={activeData.trends.presence.value}
                                trendDirection={activeData.trends.presence.direction}
                                insight={activeData.insights.presence}
                                tooltip="Percentage of prompts where your brand was detected."
                            />
                            <KpiCard
                                title="Avg Sentiment"
                                value={`${(() => {
                                    const raw = activeData.metrics.avgSentiment || 0;
                                    const score = raw <= 10 ? raw * 10 : raw;
                                    return score.toFixed(1);
                                })()}/100`}
                                label="Brand Perception"
                                icon={TrendingUp}
                                color="text-slate-900"
                                bg="bg-white border-2 border-slate-100"
                                trend={activeData.trends.sentiment.value}
                                trendDirection={activeData.trends.sentiment.direction}
                                insight={activeData.insights.sentiment}
                                tooltip="Average sentiment score (0-100) from all detected mentions."
                            />
                            <KpiCard
                                title="Response Speed"
                                value={`${(activeData.metrics.avgLatency / 1000).toFixed(2)}s`}
                                label="Avg Latency"
                                icon={Zap}
                                color="text-slate-900"
                                bg="bg-white border-2 border-slate-100"
                                trend={activeData.trends.latency.value}
                                trendDirection={activeData.trends.latency.direction}
                                insight={activeData.insights.latency}
                                tooltip="Average time taken for the model to generate a response."
                            />
                            <KpiCard
                                title="Total Activity"
                                value={activeData.metrics.totalRuns}
                                label="Prompts Executed"
                                icon={Activity}
                                color="text-slate-900"
                                bg="bg-white border-2 border-slate-100"
                                trend={activeData.trends.activity.value}
                                trendDirection={activeData.trends.activity.direction}
                                insight={activeData.insights.activity}
                                tooltip="Total number of prompts executed for this model during the period."
                            />
                        </div>

                        {/* 3. Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Source Preference - Bar Chart */}
                            <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden text-left p-0">
                                <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 leading-none m-0">
                                            Top Cited Sources
                                        </h3>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
                                                View All Sources <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader className="mb-6 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                                                    <DialogTitle className="text-lg font-bold tracking-wide uppercase text-slate-800">Cited Sources</DialogTitle>
                                                </div>
                                                <DialogDescription className="text-xs text-slate-500">
                                                    Domains cited by {selectedModel} in recent responses.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="flex flex-wrap gap-3 justify-center py-4">
                                                {activeData && activeData.allSources?.map((source, idx) => (
                                                    <div key={idx} className="flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-default">
                                                        {/* Favicon */}
                                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-50 flex-shrink-0">
                                                            <img
                                                                src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=64`}
                                                                alt={source.domain}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-slate-700 leading-none">
                                                                {source.domain}
                                                            </span>
                                                            <span className="text-[9px] font-medium text-slate-400 mt-0.5 text-left">
                                                                {source.count} citations
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!activeData || !activeData.allSources || activeData.allSources.length === 0) && (
                                                    <div className="text-center text-slate-500 py-10 w-full italic">No cited sources yet.</div>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <CardContent className="p-5">
                                    <div className="h-[250px] w-full">
                                        {sourceChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={sourceChartData} layout="vertical" margin={{ left: 10, right: 50, top: 10, bottom: 10 }}>
                                                    <defs>
                                                        {GRADIENTS.map((grad, i) => (
                                                            <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="1" y2="0">
                                                                <stop offset="0%" stopColor={grad.from} />
                                                                <stop offset="100%" stopColor={grad.to} />
                                                            </linearGradient>
                                                        ))}
                                                    </defs>
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="domain"
                                                        tick={({ x, y, payload, index }) => (
                                                            <g transform={`translate(${x},${y})`}>
                                                                <text x={0} y={0} dy={4} textAnchor="end" fill="#64748b" fontSize={11} fontWeight={600} className="capitalize">
                                                                    {index + 1}. {payload.value}
                                                                </text>
                                                            </g>
                                                        )}
                                                        width={140}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <RechartsTooltip
                                                        cursor={false}
                                                        content={({ active, payload }: any) => {
                                                            if (active && payload && payload.length) {
                                                                const count = payload[0].value as number;
                                                                const percentage = Math.round((count / totalCitations) * 100);
                                                                return (
                                                                    <div className="bg-neutral-900/95 backdrop-blur-sm text-white text-xs rounded-xl p-3 shadow-xl border border-neutral-800 max-w-[200px] z-50">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="font-bold text-neutral-100">{payload[0].payload.domain}</span>
                                                                            <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] font-mono">{percentage}%</span>
                                                                        </div>
                                                                        <div className="text-neutral-300 text-[11px] leading-tight mb-2">
                                                                            Frequently cited source for this topic regarding brand trust.
                                                                        </div>
                                                                        <div className="font-bold text-emerald-400">
                                                                            {count} Citations
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar dataKey="count" barSize={24} radius={[0, 12, 12, 0]}>
                                                        {sourceChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={`url(#grad${(index % GRADIENTS.length) + 1})`} />
                                                        ))}
                                                        <LabelList
                                                            dataKey="count"
                                                            position="right"
                                                            formatter={(value: number) => `${Math.round((value / totalCitations) * 100)}%`}
                                                            style={{ fill: '#64748b', fontSize: '11px', fontWeight: 'bold' }}
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                                No citations found yet.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card >

                            {/* Sentiment Distribution - Donut Chart */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden text-left p-0">
                                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 leading-none m-0">
                                        Sentiment Split
                                    </h3>
                                </div>
                                <CardContent className="p-5">
                                    <div className="h-[260px] w-full relative">
                                        {/* Center Label - Rendered first to stay behind the chart and tooltip */}
                                        {sentimentChartData.length > 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8 z-0">
                                                <div className="text-center">
                                                    {(() => {
                                                        const total = sentimentChartData.reduce((acc, curr) => acc + curr.value, 0);
                                                        return (
                                                            <>
                                                                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                                                                    {total}
                                                                </div>
                                                                <div className="flex flex-col items-center mt-1">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {sentimentChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <defs>
                                                        <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#34d399" />
                                                            <stop offset="100%" stopColor="#10b981" />
                                                        </linearGradient>
                                                        <linearGradient id="gradNeutral" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#fbbf24" />
                                                            <stop offset="100%" stopColor="#f59e0b" />
                                                        </linearGradient>
                                                        <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#f87171" />
                                                            <stop offset="100%" stopColor="#ef4444" />
                                                        </linearGradient>
                                                    </defs>
                                                    <Pie
                                                        data={sentimentChartData}
                                                        innerRadius={70}
                                                        outerRadius={90}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                        stroke="none"
                                                        cornerRadius={4}
                                                    >
                                                        {sentimentChartData.map((entry, index) => {
                                                            const color = entry.name === 'Positive' ? 'url(#gradPositive)' :
                                                                entry.name === 'Negative' ? 'url(#gradNegative)' : 'url(#gradNeutral)';
                                                            return <Cell key={`cell-${index}`} fill={color} strokeWidth={0} />;
                                                        })}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                const total = sentimentChartData.reduce((acc, curr) => acc + curr.value, 0);
                                                                const percent = Math.round((data.value / total) * 100);

                                                                const descriptions: Record<string, string> = {
                                                                    "Positive": "Good brand perception.",
                                                                    "Neutral": "Balanced or factual tone.",
                                                                    "Negative": "Critical or adverse views."
                                                                };

                                                                return (
                                                                    <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-xl z-50 min-w-[160px]">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className={cn(
                                                                                "text-[11px] font-bold uppercase tracking-wider",
                                                                                data.name === 'Positive' ? "text-emerald-400" :
                                                                                    data.name === 'Negative' ? "text-rose-400" : "text-amber-400"
                                                                            )}>
                                                                                {data.name}
                                                                            </span>
                                                                            <span className="text-white font-mono text-xs font-bold">{percent}%</span>
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-white mb-1">{data.value}</div>
                                                                        <div className="text-[10px] text-neutral-400 leading-tight">
                                                                            {descriptions[data.name as string]}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        height={36}
                                                        iconType="circle"
                                                        iconSize={8}
                                                        formatter={(value, entry: any) => (
                                                            <span className="text-xs font-bold text-slate-600 ml-1">{value}</span>
                                                        )}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                                No sentiment data available.
                                            </div>
                                        )}

                                    </div>
                                    <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-center">
                                        {(() => {
                                            const total = sentimentChartData.reduce((acc, curr) => acc + curr.value, 0);
                                            const dominant = [...sentimentChartData].sort((a, b) => b.value - a.value)[0];
                                            const percent = total > 0 ? Math.round((dominant.value / total) * 100) : 0;

                                            // Fallback if no data
                                            if (total === 0) return <span className="text-[11px] text-slate-400 italic">No data</span>;

                                            return (
                                                <div className={cn(
                                                    "text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-2 shadow-sm",
                                                    dominant.name === 'Positive' ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                                                        dominant.name === 'Negative' ? "text-rose-700 bg-rose-50 border-rose-100" : "text-amber-700 bg-amber-50 border-amber-100"
                                                )}>
                                                    {dominant.name === 'Positive' ? <TrendingUp className="w-3.5 h-3.5" /> :
                                                        dominant.name === 'Negative' ? <AlertCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                                    <span>Mostly {dominant.name} · {percent}%</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 4. Recent Activity Feed - Premium Layout */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden p-0 bg-slate-50/20">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 leading-none m-0">
                                        {selectedModel} Responses
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2"></div>
                            </div>

                            <div className="p-3">
                                <div className="grid gap-3">
                                    {activeData.recentActivity.length > 0 ? (
                                        [...activeData.recentActivity]
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((activity, idx) => (
                                                <Card
                                                    key={idx}
                                                    onClick={() => setSelectedActivity(activity)}
                                                    className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer active:scale-[0.99]"
                                                >
                                                    <CardContent className="p-5">
                                                        {/* Card Header: Date & Status */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                                <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                                                                    {new Date(activity.date).toLocaleDateString("en-GB", {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "2-digit",
                                                                    })}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                                                                    <Bot className="w-3.5 h-3.5" />
                                                                    {activity.modelName}
                                                                </span>
                                                            </div>

                                                            <div className={cn(
                                                                "px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm",
                                                                activity.brandsFound.length > 0
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                                            )}>
                                                                {activity.brandsFound.length > 0 ? (
                                                                    <>
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span>{activity.brandsFound.length} {activity.brandsFound.length === 1 ? 'Brand' : 'Brands'} Detected</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Activity className="w-3 h-3" />
                                                                        <span>General Inquiry</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Response Preview */}
                                                        <div className="relative pl-4 border-l-2 border-slate-200 py-1 mb-4 group-hover:border-slate-800 transition-colors">
                                                            <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2">
                                                                {activity.responseText || "No text content available..."}
                                                            </p>
                                                        </div>

                                                        {/* Insight Footer */}
                                                        <div className="flex items-start gap-2 pt-3 border-t border-slate-50 mt-4">
                                                            <div className="bg-white border border-slate-200 text-slate-900 p-1 rounded-md shadow-sm mt-0.5">
                                                                <Sparkles className="w-3 h-3" />
                                                            </div>
                                                            <div className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-1.5 leading-relaxed">
                                                                <span>Analysis mentions</span>
                                                                {activity.brandsFound.length > 0 ? (
                                                                    activity.brandsFound.map((brand: string, i: number) => (
                                                                        <div key={i} className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                                                                            <img
                                                                                src={`https://www.google.com/s2/favicons?domain=${brand.toLowerCase().replace(/\s+/g, '')}.com&sz=64`}
                                                                                alt={brand}
                                                                                className="w-3 h-3 object-contain"
                                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                                            />
                                                                            <span className="font-bold text-slate-900">{brand}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <span className="italic text-slate-400">no specific brands</span>
                                                                )}
                                                                <span>regarding recent market trends.</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                    ) : (
                                        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <Activity className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-medium text-sm">No recent activity recorded.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className="max-w-2xl bg-white border-slate-200">
                    <DialogHeader className="pb-4 border-b border-slate-100 mb-4">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-slate-900 leading-none mb-1">{selectedActivity?.modelName} Analysis</span>
                                <span className="text-[11px] font-medium text-slate-400 font-mono">
                                    {selectedActivity && new Date(selectedActivity.date).toLocaleString("en-US", {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-2 overflow-y-auto max-h-[70vh] pr-2">
                        {/* Prompt Section */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5" /> Input Prompt
                            </h4>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 font-medium leading-relaxed">
                                {selectedActivity?.promptText}
                            </div>
                        </div>

                        {/* Response Section */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> AI Response
                            </h4>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 leading-relaxed font-mono whitespace-pre-wrap shadow-sm">
                                {selectedActivity?.responseText}
                            </div>
                        </div>

                        {/* Brands Detected */}
                        {selectedActivity?.brandsFound?.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-50">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected Entities</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedActivity.brandsFound.map((brand: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${brand.toLowerCase().replace(/\s+/g, '')}.com&sz=64`}
                                                alt={brand}
                                                className="w-4 h-4 object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                            <span className="text-xs font-bold text-slate-700">{brand}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

// --- 2. Minimalist KPI Card ---
// --- 2. Executive KPI Card ---
function KpiCard({ title, value, label, icon: Icon, color, bg, trend, trendDirection, insight, tooltip }: any) {
    const isPositive = trendDirection === 'up';
    const isNeutral = trendDirection === 'flat';

    return (
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white overflow-hidden relative group">
            <CardContent className="p-5 h-full flex flex-col justify-between min-h-[160px]">
                {/* Header: Icon & Label */}
                <div className="flex items-start justify-between w-full mb-4">
                    <div className={cn("p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 transition-colors group-hover:bg-slate-100", color)}>
                        <Icon className="w-5 h-5 text-slate-800" />
                    </div>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                                    <Info className="w-3.5 h-3.5" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-xs bg-slate-900 border-slate-800 text-slate-50">
                                {tooltip || "Key Performance Metric based on recent model outputs."}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Main Value & Trend */}
                <div className="space-y-1">
                    <div className="flex items-end gap-3">
                        <div className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                            {value}
                        </div>
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md mb-1",
                                isPositive ? "text-emerald-700 bg-emerald-50" :
                                    isNeutral ? "text-slate-600 bg-slate-100" : "text-rose-700 bg-rose-50"
                            )}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                {trend}
                            </div>
                        )}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {title}
                    </div>
                </div>

                {/* Footer Insight */}
                {insight && (
                    <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-500 font-medium leading-normal flex items-start gap-1.5">
                        <div className="mt-0.5 min-w-[3px] h-[3px] rounded-full bg-slate-300" />
                        {insight}
                    </div>
                )}
            </CardContent>

            {/* Decorative Top Line */}
            <div className={cn("absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                isPositive ? "bg-emerald-400" : isNeutral ? "bg-slate-400" : "bg-rose-400"
            )} />
        </Card>
    );
}

