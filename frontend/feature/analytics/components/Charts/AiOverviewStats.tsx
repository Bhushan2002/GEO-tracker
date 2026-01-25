import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import InfoButton from "@/components/InfoButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  Loader2,
  ExternalLink,
  Smartphone,
  Globe,
  TrendingUp,
} from "lucide-react";
import {  TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";
import RealtimeBadge from "./RealtimeBadge";
import { KeyMetrics } from '../../../../hooks/useAnalyticsData';

interface AiOverviewStatsProps {
  pages: any[];
  devices: any[];
  countries: any[];
  trend: any[];
  loading: boolean;
  
  
}

export function AiOverviewStats({
  pages,
  devices,
  countries,
  trend,
  loading,

}: AiOverviewStatsProps) {
  const COLORS = ["#9333ea", "#ec4899", "#3b82f6", "#10b981"];

  // Fill in missing dates with 0 clicks
  const fillMissingDates = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // Use fullDate for parsing if available, otherwise try to reconstruct from formatted date
    const sortedData = [...data].sort((a, b) => {
      const dateA = a.fullDate || a.date;
      const dateB = b.fullDate || b.date;
      return dateA.localeCompare(dateB);
    });
    
    // Parse YYYYMMDD format to Date object
    const parseDate = (dateStr: string) => {
      if (dateStr.length === 8) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
      }
      return null;
    };
    
    const startDateStr = sortedData[0].fullDate || sortedData[0].date;
    const endDateStr = sortedData[sortedData.length - 1].fullDate || sortedData[sortedData.length - 1].date;
    
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    
    if (!startDate || !endDate) return data; // Fallback to original data if parsing fails
    
    const filledData: any[] = [];
    const dataMap = new Map(
      sortedData.map(item => [item.fullDate || item.date, item.clicks])
    );
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Format as YYYYMMDD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const yyyymmdd = `${year}${month}${day}`;
      
      // Format as "Jan 19"
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      
      filledData.push({
        date: formattedDate,
        fullDate: yyyymmdd,
        clicks: dataMap.get(yyyymmdd) || 0,
      });
    }
    
    return filledData;
  };

  const completeTrendData = fillMissingDates(trend);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Top Pages Table (Takes up 2/3 space) */}
      <Card className="lg:col-span-2 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                Top AI Overview Content
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500 font-medium">
                Pages where users clicked the "AI Overview" citation link
              </CardDescription>
            </div>
            <InfoButton content="Shows which pages on your site are being cited in Google's AI Overview and receiving clicks. Higher clicks indicate content Google finds valuable for AI summaries." />
          </div>
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
                  <TableHead className="w-[60%] text-xs font-semibold">
                    Page Title / URL
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold">
                    Clicks
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold">
                    Share
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page, i) => {
                  const total = pages.reduce(
                    (acc, curr) => acc + curr.clicks,
                    0,
                  );
                  const percent = ((page.clicks / total) * 100).toFixed(1);
                  return (
                    <TableRow
                      key={i}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-slate-900 line-clamp-1">
                            {page.title}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {page.path}
                          </span>
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
              <p className="text-xs mt-1">
                If your site appears in AI Overviews, you'll start seeing data
                within 24-48 hours.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Device Breakdown (Takes up 1/3 space) */}
      <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5">
          <div className="flex items-center justify-between">
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
            <InfoButton content="Distribution of AI Overview clicks across different device types (desktop, mobile, tablet). Helps optimize your content for the most engaged platforms." />
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
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p>No device data available</p>
              <p className="text-xs mt-1 text-center">
                If your site appears in AI Overviews, you'll start seeing data
                within 24-48 hours.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Geographic Distribution (Takes up 3/3 space) */}
      <Card className="lg:col-span-3 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <CardHeader className="border-b border-slate-100 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <div>
                <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Geographic Distribution
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 font-medium">
                  Top countries by AI Overview engagement
                </CardDescription>
              </div>
            </div>
            <InfoButton content="Shows which countries are generating the most AI Overview clicks. Use this to understand your global reach and tailor content for specific regions." />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : countries && countries.length > 0 ? (
            <div className="h-[300px] w-full pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={countries.slice(0, 10)}
                  margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {countries.slice(0, 10).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              No country data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Traffic Trend Area Chart (Takes up 3/3 space) */}

      <Card className="lg:col-span-3 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <Tooltip>
                  <TooltipTrigger>
                    <CardTitle className="font-bold text-sm uppercase tracking-wider text-slate-900 cursor-default">
                      Traffic Trend
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    Analyze how AI Overview clicks evolve over time to identify trends and patterns in user engagement.
                  </TooltipContent>
                </Tooltip>
                <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">
                  Daily AI Overview clicks over time
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {completeTrendData && completeTrendData.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">
                      Total Clicks
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {completeTrendData
                        .reduce((sum, d) => sum + d.clicks, 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">
                      Avg per Day
                    </div>
                    <div className="text-2xl font-bold text-slate-700">
                      {Math.round(
                        completeTrendData.reduce((sum, d) => sum + d.clicks, 0) /
                          completeTrendData.length,
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {/* <InfoButton content="Track how AI Overview engagement changes over time. Identify patterns, measure content performance, and spot opportunities for optimization." /> */}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : completeTrendData && completeTrendData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={completeTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorClicks"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#4285f4" stopOpacity={0.15} />
                      <stop
                        offset="95%"
                        stopColor="#4285f4"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
                    vertical={false}
                    stroke="#e5e7eb"
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 400 }}
                    tickMargin={16}
                    interval={Math.max(0, Math.floor(completeTrendData.length / 8))}
                    minTickGap={50}
                    angle={completeTrendData.length > 20 ? -45 : 0}
                    textAnchor={completeTrendData.length > 20 ? "end" : "middle"}
                    height={completeTrendData.length > 20 ? 60 : 40}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 400 }}
                    tickMargin={12}
                    width={60}
                    domain={[0, 'dataMax + 5']}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white px-3 py-2 rounded-md shadow-xl border border-slate-200">
                            <p className="text-xs font-medium text-slate-700 mb-1">
                              {payload[0].payload.date}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm text-slate-500">Event count</span>
                              <span className="text-base font-semibold text-slate-900">
                                {payload[0].value}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#4285f4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                    name="Clicks"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#4285f4",
                      strokeWidth: 3,
                      stroke: "#fff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-slate-400">
              <TrendingUp className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No trend data available</p>
              <p className="text-xs mt-1 text-center max-w-md">
                Trend data will appear once AI Overview clicks are detected over
                multiple days
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
