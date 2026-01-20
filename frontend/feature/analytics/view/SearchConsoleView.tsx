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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import {
    Globe,
    Settings,
    Search,
    MousePointerClick,
    Users,
    Zap,
    ChartBar,
    Info,
    Loader,
    Loader2,
} from "lucide-react";
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchConsoleViewProps {
    scLoading: boolean;
    gscAccount: any;
    scChartData: any[];
    searchConsoleData: any;
    scTopQueries: any[];
    scLimit: string;
    setScLimit: (value: string) => void;
    setIsSettingsOpen: (value: boolean) => void;
}

export function SearchConsoleView({
    scLoading,
    gscAccount,
    scChartData,
    searchConsoleData,
    scTopQueries,
    scLimit,
    setScLimit,
    setIsSettingsOpen,
}: SearchConsoleViewProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                    Search Console Performance
                </h3>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    • Long-tail queries (4+ words)
                </span>
            </div>

            {/* Search Console Setup or Data */}
            {scLoading ? (
                <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center h-64">
                            <Loader className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
            ) : !gscAccount ? (
                // Not Connected State
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                        <Globe className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                        Connect Search Console
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md text-center mb-6">
                        Connect your Google Search Console account in the settings panel to
                        view organic search performance data.
                    </p>
                    <Button onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Open Settings
                    </Button>
                </div>
            ) : !scChartData.length ? (
                // Connected but No Data / Loading
                <div className="flex flex-col items-center justify-center p-12 border border-slate-200 rounded-2xl bg-white">
                    <div className="bg-slate-50 p-3 rounded-xl mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                        No Data Available
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md text-center">
                        {gscAccount.siteUrl
                            ? "We couldn't find any search performance data for the selected property in this date range."
                            : "Please select a property in the settings panel to view your data."}
                    </p>
                </div>
            ) : scChartData.length > 0 ? (
                <>
                    {/* Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                    Total Clicks
                                </h3>
                                <MousePointerClick className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-slate-900">
                                    {searchConsoleData?.totals?.totalClicks?.toLocaleString() || 0}
                                </div>
                                <p className="text-xs text-slate-600/80 mt-1">
                                    From long-tail queries
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                    Total Impressions
                                </h3>
                                <Users className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-slate-900">
                                    {searchConsoleData?.totals?.totalImpressions?.toLocaleString() || 0}
                                </div>
                                <p className="text-xs text-slate-600/80 mt-1">
                                    Times shown in search
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                    Average CTR
                                </h3>
                                <Zap className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-slate-900">
                                    {((searchConsoleData?.totals?.avgCtr || 0) * 100).toFixed(2)}%
                                </div>
                                <p className="text-xs text-slate-600/80 mt-1">
                                    Click-through rate
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                    Average Position
                                </h3>
                                <ChartBar className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-slate-900">
                                    {(searchConsoleData?.totals?.avgPosition || 0).toFixed(1)}
                                </div>
                                <p className="text-xs text-slate-600/80 mt-1">
                                    In search results
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Long-Tail Queries Chart */}
                    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-100 px-5 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                        Long-Tail Query Performance Over Time
                                    </CardTitle>
                                    <CardDescription className="text-[10px] text-slate-500 font-medium">
                                        Clicks and impressions for detailed search queries (4+ words)
                                    </CardDescription>
                                </div>
                                <InfoTooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Shows search performance trends for queries with 4 or more
                                        words - typically more specific, high-intent searches
                                    </TooltipContent>
                                </InfoTooltip>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={scChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#6b7280"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(date) => {
                                            const d = new Date(date);
                                            return d.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            });
                                        }}
                                    />
                                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "white",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "6px",
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        name="Clicks"
                                        dot={{ fill: "#3b82f6", r: 1 }}
                                        activeDot={{ r: 3 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="impressions"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        name="Impressions"
                                        dot={{ fill: "#8b5cf6", r: 1 }}
                                        activeDot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Queries Table */}
                    {scTopQueries.length > 0 && (
                        <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 px-5 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                            Top Long-Tail Queries
                                        </CardTitle>
                                        <CardDescription className="text-[10px] text-slate-500 font-medium">
                                            Search queries with 4+ words driving traffic
                                        </CardDescription>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Limit Selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                                Rows:
                                            </span>
                                            <Select value={scLimit} onValueChange={setScLimit}>
                                                <SelectTrigger className="h-7 w-[70px] text-xs font-semibold bg-slate-50 border-slate-200">
                                                    <SelectValue placeholder="50" />
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value="25" className="text-xs">
                                                        25
                                                    </SelectItem>
                                                    <SelectItem value="50" className="text-xs">
                                                        50
                                                    </SelectItem>
                                                    <SelectItem value="100" className="text-xs">
                                                        100
                                                    </SelectItem>
                                                    <SelectItem value="250" className="text-xs">
                                                        250
                                                    </SelectItem>
                                                    <SelectItem value="500" className="text-xs">
                                                        500
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <InfoTooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Shows the most common long-tail search queries (4+ words)
                                                that bring users to your site
                                            </TooltipContent>
                                        </InfoTooltip>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {scLoading && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    </div>
                                )}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold border-r border-slate-100 last:border-r-0 w-[50px]">
                                                #
                                            </TableHead>
                                            <TableHead className="font-semibold border-r border-slate-100 last:border-r-0">
                                                Query
                                            </TableHead>
                                            <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                                Clicks
                                            </TableHead>
                                            <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                                Impressions
                                            </TableHead>
                                            <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                                CTR
                                            </TableHead>
                                            <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                                Avg Position
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scTopQueries.map((query: any, index: number) => (
                                            <TableRow
                                                key={index}
                                                className="hover:bg-slate-50/50 transition-colors"
                                            >
                                                <TableCell className="font-medium text-gray-600 border-r border-slate-100 last:border-r-0">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="max-w-md border-r border-slate-100 last:border-r-0">
                                                    <span className="text-sm font-medium">
                                                        {query.query}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-blue-600 border-r border-slate-100 last:border-r-0">
                                                    {query.clicks.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                                    {query.impressions.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                                    <span
                                                        className={`font-medium ${query.ctr > 0.05
                                                                ? "text-green-600"
                                                                : "text-gray-600"
                                                            }`}
                                                    >
                                                        {(query.ctr * 100).toFixed(2)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                                    <span
                                                        className={`font-medium ${query.position <= 10
                                                                ? "text-green-600"
                                                                : "text-gray-600"
                                                            }`}
                                                    >
                                                        {query.position.toFixed(1)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Globe className="h-12 w-12 mb-3 opacity-20" />
                            <p className="font-medium">Search Console not available</p>
                            <p className="text-sm mt-2">
                                Re-authenticate to grant Search Console permissions
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
