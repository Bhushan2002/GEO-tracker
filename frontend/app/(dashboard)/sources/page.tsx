"use client";

import React, { useMemo, useState } from "react";
import { DUMMY_MODEL_RESPONSES } from "@/lib/dummy-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Cell
} from "recharts";
import { Search, Download, Globe, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfDay, isSameDay } from "date-fns";

// --- Types ---
type Tab = "Domains" | "URLs";

// --- Helper: Domain Types Mapping (Static fallback if not in data) ---
const DOMAIN_TYPE_MAP: Record<string, string> = {
  "novartis.com": "You",
  "pfizer.com": "Competitor",
  "roche.com": "Competitor",
  "merck.com": "Competitor",
  "sanofi.com": "Competitor",
  "healthline.com": "Editorial",
  "bloomberg.com": "Editorial",
  "reuters.com": "Editorial",
  "who.int": "Institutional",
  "mayoclinic.org": "Institutional",
  "webmd.com": "Editorial",
  "reddit.com": "UGC",
};

const URL_TYPE_POOL = ["Article", "Comparison", "Listicle", "How-To Guide", "Product Page", "Discussion"];

export default function SourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Domains");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMentionRow, setActiveMentionRow] = useState<number | null>(null);

  // --- 1. Process Data from DUMMY_MODEL_RESPONSES ---

  // A. Extract all Domain/URL occurrences per day
  const dailyStats = useMemo(() => {
    // Map: DateStr -> { domains: {name: count}, urls: {type: count} }
    const stats: Record<string, { domains: Record<string, number>, urlTypes: Record<string, number> }> = {};
    const domainTotals: Record<string, number> = {};

    DUMMY_MODEL_RESPONSES.forEach(res => {
      const date = format(parseISO(res.createdAt), "MMM d");

      if (!stats[date]) {
        stats[date] = { domains: {}, urlTypes: {} };
      }

      res.identifiedBrands?.forEach((brand: any) => {
        brand.associated_domain?.forEach((d: any) => {
          const domain = d.domain_citation;
          if (domain) {
            // Count for daily graph
            stats[date].domains[domain] = (stats[date].domains[domain] || 0) + 1;
            // Count for global totals
            domainTotals[domain] = (domainTotals[domain] || 0) + 1;

            // Mock URL Type assignment since raw data might not have it explicitly
            const mockUrlType = URL_TYPE_POOL[Math.floor(Math.random() * URL_TYPE_POOL.length)];
            stats[date].urlTypes[mockUrlType] = (stats[date].urlTypes[mockUrlType] || 0) + 1;
          }
        });
      });
    });

    return { stats, domainTotals };
  }, []);

  // B. Identify Top 5 Domains Globally
  const top5Domains = useMemo(() => {
    return Object.entries(dailyStats.domainTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain]) => domain);
  }, [dailyStats]);

  // C. Build Graph Data
  const graphData = useMemo(() => {
    // Get all unique dates from responses and sort them
    const dates = Array.from(new Set(DUMMY_MODEL_RESPONSES.map(r => format(parseISO(r.createdAt), "MMM d"))))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // If sorting by string "MMM d" fails (e.g. Dec vs Jan), rely on original timestamps if possible
    // Better approach: Get unique dates as ISO strings first, sort them, then format
    const uniqueDates = Array.from(new Set(DUMMY_MODEL_RESPONSES.map(r => startOfDay(parseISO(r.createdAt)).toISOString())))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return uniqueDates.map(isoDate => {
      const dateKey = format(parseISO(isoDate), "MMM d"); // e.g., "Dec 25", "Jan 1"
      const dayData = dailyStats.stats[dateKey] || { domains: {}, urlTypes: {} };

      const point: any = { date: dateKey };

      // Fill Top 5 Domains Data
      top5Domains.forEach(domain => {
        point[domain] = dayData.domains[domain] || 0;
      });

      // Fill URL Types Data
      URL_TYPE_POOL.forEach(type => {
        point[type] = dayData.urlTypes[type] || 0;
      });

      return point;
    });
  }, [dailyStats, top5Domains]);

  // D. Build Table Data (with Search Filtering)
  const tableData = useMemo(() => {
    let data;
    if (activeTab === "Domains") {
      data = Object.entries(dailyStats.domainTotals).map(([domain, count]) => ({
        source: domain,
        type: DOMAIN_TYPE_MAP[domain] || "Other",
        used: count, // Raw count for now, maybe % later
        avgCitations: (1 + Math.random()).toFixed(1)
      })).sort((a, b) => b.used - a.used);
    } else {
      // Mocking URL List based on domains
      const urls: any[] = [];
      Object.keys(dailyStats.domainTotals).forEach(domain => {
        for (let i = 0; i < 3; i++) {
          // Generate realistic mentions based on available domains
          const shouldHaveMentions = Math.random() > 0.3;
          const mentionedDomains = shouldHaveMentions
            ? top5Domains.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1)
            : [];

          urls.push({
            url: `https://${domain}/health-report-${2025 + i}`,
            title: `${domain} Analysis Report`,
            type: URL_TYPE_POOL[i % URL_TYPE_POOL.length],
            mentioned: mentionedDomains.length > 0 ? "Yes" : "No",
            mentions: mentionedDomains.map(d => ({
              domain: d,
              name: d.split('.')[0].charAt(0).toUpperCase() + d.split('.')[0].slice(1)
            })),
            updated: "2 days ago",
            usedTotal: Math.floor(Math.random() * 50) + 10,
            avgCitations: (Math.random() * 2 + 1).toFixed(1)
          })
        }
      });
      data = urls.sort((a, b) => b.usedTotal - a.usedTotal);
    }

    // Apply Search Filter
    if (!searchQuery.trim()) return data;

    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item: any) => {
      if (activeTab === "Domains") {
        return item.source.toLowerCase().includes(lowerQuery) || item.type.toLowerCase().includes(lowerQuery);
      } else {
        return item.title.toLowerCase().includes(lowerQuery) || item.url.toLowerCase().includes(lowerQuery);
      }
    });
  }, [activeTab, dailyStats, searchQuery, top5Domains]);


  // --- Colors & Keys ---
  const DOMAIN_COLORS = {
    [top5Domains[0]]: "#10B981", // Rank 1
    [top5Domains[1]]: "#3B82F6", // Rank 2
    [top5Domains[2]]: "#EF4444", // Rank 3
    [top5Domains[3]]: "#F59E0B", // Rank 4
    [top5Domains[4]]: "#8B5CF6", // Rank 5
  };

  const URL_COLORS: Record<string, string> = {
    "Article": "#8B5CF6",
    "Comparison": "#3B82F6",
    "How-To Guide": "#10B981",
    "Listicle": "#F59E0B",
    "Product Page": "#EF4444",
    "Discussion": "#9CA3AF"
  };

  const currentColors = activeTab === "Domains" ? DOMAIN_COLORS : URL_COLORS;
  const graphKeys = activeTab === "Domains" ? top5Domains : ["Article", "Comparison", "How-To Guide", "Listicle"];

  const pieData = activeTab === "Domains"
    ? [
      { name: 'Competitor', value: 35 },
      { name: 'You', value: 25 },
      { name: 'Editorial', value: 20 },
      { name: 'Institutional', value: 10 },
      { name: 'UGC', value: 10 },
    ]
    : [
      { name: 'Article', value: 40 },
      { name: 'Comparison', value: 25 },
      { name: 'How-To Guide', value: 15 },
      { name: 'Listicle', value: 10 },
      { name: 'Other', value: 10 },
    ];


  return (
    <div className="min-h-screen p-6 space-y-8 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Sources</h1>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(["Domains", "URLs"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all cursor-pointer",
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("space-y-6", "animate-in fade-in slide-in-from-bottom-2 duration-700")}>
        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 h-[360px] w-full">
          {/* Main Chart */}
          <Card className="lg:col-span-2 p-6 flex flex-col shadow-sm border-slate-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {activeTab === "Domains" ? "Source Usage by Domain (Top 5)" : "Source Usage by URL Type"}
              </h3>
              {/* Custom Graph Legend */}
              <div className="flex items-center justify-end gap-2 flex-wrap min-h-[24px]">
                {graphKeys.map((key) => (
                  <div key={key} className="flex items-center gap-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (currentColors as any)[key] }} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{key}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  {graphKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={(currentColors as any)[key]}
                      strokeWidth={2}
                      dot={{ r: 0 }}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart */}
          <Card className="p-6 flex flex-col shadow-sm border-slate-200 h-full">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
              {activeTab === "Domains" ? "Sources Type Distribution" : "URL Type Distribution"}
            </h3>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-900">
                  {activeTab === "Domains" ? "124" : "96"}
                </span>
                <span className="text-xs text-slate-500 font-medium">Citations</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(activeTab === "Domains" ? DOMAIN_COLORS[top5Domains[index % 5]] : URL_COLORS[entry.name]) || "#9CA3AF"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (activeTab === "Domains" ? DOMAIN_COLORS[top5Domains[index % 5]] : (URL_COLORS[entry.name] || "#9CA3AF")) }} />
                  <span className="text-[10px] uppercase font-bold text-slate-500">{entry.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Table & Search Group */}
        <div className="flex flex-col gap-2 w-full flex-1">
          {/* Search Bar */}
          <div className="flex items-center justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search sources..."
                className="pl-9 w-[300px] h-9 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="w-full flex-1 min-h-0">
            <div className="overflow-auto bg-white grow rounded-xl border border-slate-200 shadow-sm max-h-[600px]">
              <table className="w-full caption-bottom text-sm border-collapse">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-200">
                    <TableHead className="sticky top-0 z-10 bg-slate-50 w-[56px] pl-6 py-3 text-center font-bold text-[10px] uppercase tracking-wider text-slate-500 border-r border-slate-100">#</TableHead>
                    <TableHead className={cn("sticky top-0 z-10 bg-slate-50 font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3 border-r border-slate-100", activeTab === "Domains" ? "w-[300px]" : "w-[300px]")}>
                      {activeTab === "Domains" ? "Source" : "URL"}
                    </TableHead>
                    <TableHead className={cn("sticky top-0 z-10 bg-slate-50 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-center py-3 border-r border-slate-100", activeTab === "Domains" ? "w-[170px]" : "w-[140px]")}>
                      {activeTab === "Domains" ? "Domain Type" : "URL Type"}
                    </TableHead>

                    {activeTab === "URLs" && (
                      <>
                        <TableHead className="sticky top-0 z-10 bg-slate-50 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-center py-3 border-r border-slate-100 w-[100px]">Mentioned</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-slate-50 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-center py-3 border-r border-slate-100 w-[120px]">Mentions</TableHead>
                      </>
                    )}

                    <TableHead className={cn("sticky top-0 z-10 bg-slate-50 text-center font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3 border-r border-slate-100", activeTab === "Domains" ? "w-[130px]" : "w-[100px]")}>
                      {activeTab === "Domains" ? "Total Used" : "Used Total"}
                    </TableHead>
                    <TableHead className={cn("sticky top-0 z-10 bg-slate-50 text-center font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3 pr-6", activeTab === "Domains" ? "w-[150px]" : "w-[120px]")}>
                      Avg. Citations
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((item: any, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/30 h-14 border-b border-slate-100 last:border-0 transition-all group">
                      <TableCell className="text-center text-xs font-bold text-slate-400 pl-6 py-4 border-r border-slate-100">{idx + 1}</TableCell>
                      <TableCell className="border-r border-slate-100 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0">
                            {activeTab === "Domains" ? (
                              <img
                                src={`https://logo.clearbit.com/${item.source}`}
                                alt={item.source}
                                className="h-5 w-5 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.src.includes('google.com')) {
                                    target.src = `https://www.google.com/s2/favicons?domain=${item.source}&sz=64`;
                                  }
                                }}
                              />
                            ) : (
                              <FileText className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            {activeTab === "Domains" ? (
                              <div className="text-[13px] font-bold text-slate-800">{item.source}</div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800 line-clamp-1 max-w-[400px]">{(item as any).title}</span>
                                <a href={(item as any).url} target="_blank" className="text-[10px] text-blue-500 hover:underline line-clamp-1 max-w-[400px]">{(item as any).url}</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-slate-100 text-center py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-bold border text-center min-w-[75px] inline-block capitalize",
                          activeTab === "Domains" ? (
                            item.type === "Competitor" ? "bg-red-50 text-red-600 border-red-100" :
                              item.type === "You" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                item.type === "Editorial" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                  item.type === "Institutional" ? "bg-purple-50 text-purple-600 border-purple-100" :
                                    "bg-slate-50 text-slate-600 border-slate-100"
                          ) : (
                            (URL_COLORS as any)[item.type] ? `bg-slate-50 text-slate-600 border-slate-200` : "bg-slate-50"
                          )
                        )}
                          style={activeTab === "URLs" && (URL_COLORS as any)[item.type] ? {
                            color: (URL_COLORS as any)[item.type],
                            backgroundColor: `${(URL_COLORS as any)[item.type]}15`,
                            borderColor: `${(URL_COLORS as any)[item.type]}30`
                          } : {}}
                        >
                          {item.type}
                        </span>
                      </TableCell>

                      {activeTab === "URLs" && (
                        <>
                          <TableCell className="text-center border-r border-slate-100 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              (item as any).mentioned === "Yes" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                            )}>
                              {(item as any).mentioned}
                            </span>
                          </TableCell>
                          <TableCell className="relative border-r border-slate-100 py-4">
                            <div
                              className="flex -space-x-2 cursor-pointer origin-left p-1 group z-0 min-w-[60px] justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMentionRow(activeMentionRow === idx ? null : idx);
                              }}
                            >
                              {(item as any).mentions.length === 0 && <span className="text-[10px] text-slate-300 italic pl-1">-</span>}
                              {(item as any).mentions.map((m: any, i: number) => (
                                <div key={i} className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm relative hover:z-20 hover:scale-110 transition-all z-10 w-auto">
                                  <img
                                    src={`https://logo.clearbit.com/${m.domain}`}
                                    alt={m.name}
                                    className="h-4 w-4 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (!target.src.includes('google.com')) {
                                        target.src = `https://www.google.com/s2/favicons?domain=${m.domain}&sz=64`;
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Detail Popover */}
                            {activeMentionRow === idx && (
                              <>
                                <div
                                  className="fixed inset-0 z-40 bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMentionRow(null);
                                  }}
                                />
                                <div className="absolute top-8 left-2 bg-white p-3 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] border border-slate-100 z-50 min-w-[200px] animate-in fade-in zoom-in-95 slide-in-from-top-2 ring-1 ring-slate-100">
                                  <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-50 pb-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mentioned Brands</h4>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">{(item as any).mentions.length}</span>
                                  </div>
                                  <div className="space-y-1">
                                    {(item as any).mentions.map((m: any, i: number) => (
                                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-default group">
                                        <div className="h-6 w-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:border-slate-200 transition-colors">
                                          <img
                                            src={`https://logo.clearbit.com/${m.domain}`}
                                            alt={m.name}
                                            className="h-4 w-4 object-contain"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              if (!target.src.includes('google.com')) {
                                                target.src = `https://www.google.com/s2/favicons?domain=${m.domain}&sz=64`;
                                              }
                                            }}
                                          />
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-700 group-hover:text-slate-900">{m.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </TableCell>
                        </>
                      )}

                      <TableCell className="text-center border-r border-slate-100 py-4">
                        <span className="text-[13px] font-bold text-slate-900">
                          {activeTab === "Domains" ? item.used : (item as any).usedTotal}
                        </span>
                      </TableCell>
                      <TableCell className="text-center pr-6 py-4">
                        <span className="text-[13px] font-bold text-slate-600">{item.avgCitations}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
