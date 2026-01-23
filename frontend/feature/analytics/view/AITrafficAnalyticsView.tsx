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
    ChartBar,
    Users,
    MousePointerClick,
    Zap,
    Globe,
    Smartphone,
    Loader,
    Info,
} from "lucide-react";
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import WebTrafficChart from "@/feature/analytics/components/Charts/WebTrafficChart";
import { AiOverviewStats } from "@/feature/analytics/components/Charts/AiOverviewStats";
import FirstTouchChart from "@/feature/analytics/components/Charts/FirstTouchChart";
import { ZeroTouchChart } from "@/feature/analytics/components/Charts/ZeroTouchChart";
import { AIConversionRateChart } from "@/feature/analytics/components/Charts/AIConversionRateChart";
import { TopicClustersTreemap } from "@/feature/analytics/components/Charts/TopicClusterTree";
import { AIGrowthRateChart } from "@/feature/analytics/components/Charts/AIGrowthRateChart";
import CitationsPieChart from "@/feature/analytics/components/Charts/CitationsPieChart";
import { TrafficByModel } from "@/feature/analytics/components/Charts/TrafficByModel";
import AiModelPerformanceTable from "@/feature/analytics/components/Charts/AiModelPerformanceTable";
import LandingPageTable from "@/feature/analytics/components/Charts/LandingPageTable";
import { AIDeviceBreakdownChart } from "@/feature/analytics/components/Charts/AIDeviceBreakdownChart";
import { AiDemographicsChart } from "@/feature/analytics/components/Charts/AiDemographicsChart";

interface KeyMetrics {
    aiOverviewClicks: number;
    activeUsers: number;
    engagedSessions: number;
    keyEvents: number;
}

interface AITrafficAnalyticsViewProps {
    loading: boolean;
    keyMetrics: KeyMetrics;
    chartData: any[];
    aiOverviewStats: { pages: any[]; devices: any[] };
    firstTouchData: any[];
    zeroTouchData: any[];
    conversionRateData: any[];
    topicClusterData: any[];
    aiGrowthData: any[];
    aiModelsData: any[];
    aiLandingPageData: any[];
    aiDeviceData: any[];
    demographicsData: any[];
    limit: string;
    setLimit: (value: string) => void;
    formatDate: (dateValue: any) => string;
}

export function AITrafficAnalyticsView({
    loading,
    keyMetrics,
    chartData,
    aiOverviewStats,
    firstTouchData,
    zeroTouchData,
    conversionRateData,
    topicClusterData,
    aiGrowthData,
    aiModelsData,
    aiLandingPageData,
    aiDeviceData,
    demographicsData,
    limit,
    setLimit,
    formatDate,
}: AITrafficAnalyticsViewProps) {
    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <ChartBar className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">
                        Engagement & Quality
                    </h3>
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • Key metrics overview
                    </span>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className=" bg-card  rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                AI Overview Clicks
                            </h3>
                            <Users className="h-4 w-4 text-slate-400" />
                        </div>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-slate-900">
                                {(keyMetrics.aiOverviewClicks ?? 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-600/80 mt-1">
                                Visits via "AI Overview" highlights
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Active Users
                            </h3>
                            <Users className="h-4 w-4 text-slate-400" />
                        </div>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-foreground">
                                {keyMetrics.activeUsers}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total active users in period
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Engaged Sessions
                            </h3>
                            <MousePointerClick className="h-4 w-4 text-slate-400" />
                        </div>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-foreground">
                                {keyMetrics.engagedSessions}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sessions longer than 10s
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Key Events
                            </h3>
                            <Zap className="h-4 w-4 text-slate-400" />
                        </div>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-foreground">
                                {keyMetrics.keyEvents}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Conversions and important actions
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Website Traffic Chart */}
                <WebTrafficChart
                    loading={loading}
                    chartData={chartData}
                    formatDate={formatDate}
                />
            </div>

            {/* 2. User Journey and Conversion */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">
                        User Journey & Conversion
                    </h3>
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • Attribution analysis
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* First touch chart */}
                    <FirstTouchChart
                        data={firstTouchData}
                        loading={loading}
                        formatDate={formatDate}
                    />
                    {/* Zero touch chart */}
                    <ZeroTouchChart
                        data={zeroTouchData}
                        loading={loading}
                        formatDate={formatDate}
                    />

                    {/* AI Conversion Rate Charttt */}
                    <div className="col-span-1 lg:col-span-2">
                        <AIConversionRateChart data={conversionRateData} />
                    </div>
                </div>
            </div>

            {/* 3. Content Performance (AEO Specific) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">
                        Content Performance
                    </h3>
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • AEO Specific Insights
                    </span>
                </div>

                {/* Topic Clusters & Growth */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <TopicClustersTreemap data={topicClusterData} />
                    </div>
                    <AIGrowthRateChart data={aiGrowthData} loading={loading} />

                    {/* AI Models Distribution Pie */}
                    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-100  px-5 ">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                        AI Models Distribution
                                    </CardTitle>
                                    <CardDescription className="text-[10px] text-slate-500 font-medium">
                                        Traffic share by AI model
                                    </CardDescription>
                                </div>
                                <InfoTooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Breakdown of user traffic distribution across different AI
                                        models (ChatGPT, Copilot, Perplexity, etc.)
                                    </TooltipContent>
                                </InfoTooltip>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <CitationsPieChart
                                    data={aiModelsData
                                        .filter((item) => item.users > 0)
                                        .map((item, index) => {
                                            const colors = [
                                                "#10B981", // ChatGPT - green
                                                "#3B82F6", // Copilot - blue
                                                "#8B5CF6", // Perplexity - purple
                                                "#F97316", // Gemini - orange
                                                "#06B6D4", // Claude - cyan
                                            ];
                                            return {
                                                name: item.model,
                                                value: item.users,
                                                color: colors[index % colors.length],
                                            };
                                        })}
                                    totalCitations={aiModelsData.reduce(
                                        (sum, item) => sum + item.users,
                                        0
                                    )}
                                    label="Total Users"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Traffic by AI Model Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Traffic by AI Modeles Bar */}
                    <TrafficByModel loading={loading} aiModelsData={aiModelsData} />

                    {/* AI Model Performance Table */}
                    <AiModelPerformanceTable
                        loading={loading}
                        aiModelsData={aiModelsData}
                    />
                </div>

                {/* Landing Pages table*/}

                <LandingPageTable
                    loading={loading}
                    aiLandingPageData={aiLandingPageData}
                    limit={limit}
                    setLimit={setLimit}
                />
            </div>

            {/* 4. Technical and Demographics */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">
                        Technical & Demographics
                    </h3>
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • Device breakdown
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AIDeviceBreakdownChart data={aiDeviceData} loading={loading} />
                    <AiDemographicsChart data={demographicsData} />
                </div>
            </div>
        </>
    );
}
