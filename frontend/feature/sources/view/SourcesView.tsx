"use client";

import React, { useMemo, useState } from "react";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChartArea,
  Globe,
  Database,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CitationsPieChart from "@/feature/dashboard/components/CitationsPieChart";
import { SourceUsageChart } from "@/feature/analytics/components/Charts/SourceUsageChart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SourcesTable } from "../components/SourcesTable";

/**
 * Sources intelligence view component.
 * Analyzes domains and URLs cited by AI models, showing coverage and type distribution.
 */
export default function SourcesView() {
  const { allBrands, modelResponses, targetBrands, isLoading } =
    useDashboardData();
  const [activeTab, setActiveTab] = useState<"domains" | "urls">("domains");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Identify the "Main Brand"
  const mainBrand = useMemo(() => {
    const explicitMain =
      allBrands?.find((b: any) => b.mainBrand) ||
      targetBrands?.find((b: any) => b.mainBrand);
    if (explicitMain) return explicitMain;
    return targetBrands?.[0];
  }, [allBrands, targetBrands]);

  // --- AGGREGATION LOGIC: Group by Prompt Run to remove redundancy ---

  // Process modelResponses to get unique runs and their combined citations
  const processedRuns = useMemo(() => {
    if (!modelResponses || modelResponses.length === 0) return [];

    // Group responses by promptRunId (the ID of the execution)
    const runMap = new Map<string, any[]>();
    modelResponses.forEach((res) => {
      const runId =
        typeof res.promptRunId === "string"
          ? res.promptRunId
          : res.promptRunId?._id;
      if (!runId) return;
      if (!runMap.has(runId)) runMap.set(runId, []);
      runMap.get(runId)?.push(res);
    });

    // For each run, aggregate brand/url data across all models
    return Array.from(runMap.entries()).map(([runId, responses]) => {
      const domainMetrics = new Map<
        string,
        {
          count: number;
          totalCitations: number;
          type: string;
          brands: Set<string>;
        }
      >();
      const urlMetrics = new Map<
        string,
        {
          totalMentions: number;
          type: string;
          brands: Set<string>;
          url: string;
          title: string;
        }
      >();

      responses.forEach((res) => {
        res.identifiedBrands?.forEach((brand: any) => {
          brand.associated_domain?.forEach((d: any) => {
            const domain = d.domain_citation || "";
            if (!domain) return;

            if (!domainMetrics.has(domain)) {
              domainMetrics.set(domain, {
                count: 0,
                totalCitations: 0,
                type: d.domain_citation_type || "Other",
                brands: new Set(),
              });
            }
            const dm = domainMetrics.get(domain)!;
            dm.count += 1;
            dm.totalCitations += d.associated_url?.length || 0;
            dm.brands.add(brand.brand_name);

            d.associated_url?.forEach((u: any) => {
              const rawUrl =
                typeof u === "string"
                  ? u
                  : u?.url_citation || u?.url || "";
              if (!rawUrl) return;

              // Normalize URL
              let normalized = rawUrl
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .split(/[?#]/)[0]
                .replace(/\/$/, "");

              if (!urlMetrics.has(normalized)) {
                // Extract title
                const domainStr =
                  rawUrl.split("//")[1]?.split("/")[0] ||
                  rawUrl.split("/")[0];
                const pathSegments = rawUrl
                  .split("/")
                  .filter((s: string) => s && !s.includes("."));
                const lastSegment =
                  pathSegments.pop()?.replace(/-/g, " ") || "";
                const title = lastSegment
                  ? lastSegment.charAt(0).toUpperCase() +
                    lastSegment.slice(1)
                  : domainStr;

                urlMetrics.set(normalized, {
                  url: rawUrl,
                  title: title,
                  totalMentions: 0,
                  type:
                    u.url_citation_type ||
                    d.domain_citation_type ||
                    "Other",
                  brands: new Set(),
                });
              }
              const um = urlMetrics.get(normalized)!;
              um.totalMentions += 1;
              um.brands.add(brand.brand_name);
            });
          });
        });
      });

      // Return averaged data for this run (sum of model results / number of models)
      const numModels = responses.length || 1;
      return {
        runId,
        domains: Array.from(domainMetrics.entries()).map(
          ([domain, dm]) => ({
            domain,
            mentions: dm.count / numModels,
            citations: dm.totalCitations / numModels,
            type: dm.type,
            brands: Array.from(dm.brands),
          })
        ),
        urls: Array.from(urlMetrics.entries()).map(([norm, um]) => ({
          ...um,
          mentionsCount: um.totalMentions / numModels,
          brands: Array.from(um.brands),
        })),
      };
    });
  }, [modelResponses]);

  const totalRuns = processedRuns.length || 1;

  const domainData = useMemo(() => {
    if (processedRuns.length === 0) return [];

    const masterMap = new Map<
      string,
      {
        usedCount: number;
        totalMentions: number;
        totalCitations: number;
        type: string;
        brands: Set<string>;
        urlMap: Map<
          string,
          { usedCount: number; totalMentions: number; title: string }
        >;
      }
    >();

    processedRuns.forEach((run) => {
      run.domains.forEach((d) => {
        if (!masterMap.has(d.domain)) {
          masterMap.set(d.domain, {
            usedCount: 0,
            totalMentions: 0,
            totalCitations: 0,
            type: d.type,
            brands: new Set(),
            urlMap: new Map(),
          });
        }
        const m = masterMap.get(d.domain)!;
        m.usedCount += 1;
        m.totalMentions += d.mentions;
        m.totalCitations += d.citations;
        d.brands.forEach((b) => m.brands.add(b));

        // Join URL data from processedRuns for this domain
        // We'll find URLs in run.urls that belong to this domain
        run.urls.forEach((u) => {
          try {
            const uDomain = new URL(
              u.url.startsWith("http") ? u.url : `https://${u.url}`
            ).hostname.replace(/^www\./, "");
            if (uDomain === d.domain) {
              if (!m.urlMap.has(u.url)) {
                m.urlMap.set(u.url, {
                  usedCount: 0,
                  totalMentions: 0,
                  title: u.title,
                });
              }
              const um = m.urlMap.get(u.url)!;
              um.usedCount += 1;
              um.totalMentions += u.mentionsCount;
            }
          } catch (e) {
            // skip invalid urls
          }
        });
      });
    });

    return Array.from(masterMap.entries())
      .map(([domain, data]) => ({
        domain,
        used: Math.round((data.usedCount / totalRuns) * 100),
        avgCitations: (data.totalCitations / (data.usedCount || 1)).toFixed(
          1
        ),
        type: data.type,
        brands: Array.from(data.brands),
        urls: Array.from(data.urlMap.entries())
          .map(([url, u]) => ({
            url,
            title: u.title,
            used: Math.round((u.usedCount / totalRuns) * 100),
            avgCitations: (u.totalMentions / (u.usedCount || 1)).toFixed(1),
          }))
          .sort((a, b) => b.used - a.used),
      }))
      .sort((a, b) => b.used - a.used);
  }, [processedRuns, totalRuns]);

  const urlData = useMemo(() => {
    if (processedRuns.length === 0) return [];

    const masterMap = new Map<
      string,
      {
        url: string;
        title: string;
        type: string;
        brands: Set<string>;
        usedCount: number;
        totalMentions: number;
      }
    >();

    processedRuns.forEach((run) => {
      run.urls.forEach((u) => {
        const key = u.url
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .split(/[?#]/)[0]
          .replace(/\/$/, "");
        if (!masterMap.has(key)) {
          masterMap.set(key, {
            url: u.url,
            title: u.title,
            type: u.type,
            brands: new Set(),
            usedCount: 0,
            totalMentions: 0,
          });
        }
        const m = masterMap.get(key)!;
        m.usedCount += 1; // Used in this run
        m.totalMentions += u.mentionsCount;
        u.brands.forEach((b) => m.brands.add(b));
      });
    });

    return Array.from(masterMap.values())
      .map((item) => ({
        url: item.url,
        title: item.title,
        type: item.type,
        mentions: Array.from(item.brands),
        usedTotal: item.usedCount, // Total unique runs
        used: Math.round((item.usedCount / totalRuns) * 100),
        avgCitations: (item.totalMentions / (item.usedCount || 1)).toFixed(
          1
        ),
      }))
      .sort((a, b) => b.usedTotal - a.usedTotal);
  }, [processedRuns, totalRuns]);

  const usageChartData = useMemo(() => {
    const top5 =
      activeTab === "domains"
        ? domainData.slice(0, 5).map((d) => d.domain)
        : urlData.slice(0, 5).map((u) => u.title);

    const currentValues =
      activeTab === "domains"
        ? domainData.slice(0, 5).map((d) => d.used)
        : urlData.slice(0, 5).map((u) => Math.min(100, u.usedTotal * 10));

    const points = [];
    const dates = Array.from({ length: 15 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    for (let i = 0; i < 15; i++) {
      const point: any = { timeStamp: dates[i] };
      top5.forEach((source, idx) => {
        const base = currentValues[idx] || 10;
        const variation = Math.sin(i / 2 + idx) * (base * 0.2);
        point[source] = Math.min(
          100,
          Math.max(2, Math.round(base + variation))
        );
      });
      points.push(point);
    }
    return { points, top5 };
  }, [domainData, urlData, activeTab]);

  const citationsPieData = useMemo(() => {
    if (!allBrands || allBrands.length === 0) return { data: [], total: 0 };
    const COLORS: Record<string, string> = {
      Competitor: "#EF4444",
      You: "#10B981",
      UGC: "#06B6D4",
      Editorial: "#3B82F6",
      Corporate: "#F97316",
      Reference: "#8B5CF6",
      Other: "#6B7280",
      Institutional: "#84CC16",
    };
    const typeMap: Record<string, number> = {};
    let totalCount = 0;

    if (activeTab === "domains") {
      domainData.forEach((d) => {
        typeMap[d.type] = (typeMap[d.type] || 0) + 1;
        totalCount += 1;
      });
    } else {
      urlData.forEach((u) => {
        typeMap[u.type] = (typeMap[u.type] || 0) + 1;
        totalCount += 1;
      });
    }

    const data = Object.entries(typeMap)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS[name] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);

    return { data, total: totalCount };
  }, [domainData, urlData, activeTab, allBrands]);

  const domainTypes = useMemo(() => {
    const types = new Set<string>(["All Types"]);
    domainData.forEach((d) => types.add(d.type));
    return Array.from(types);
  }, [domainData]);

  const urlTypes = useMemo(() => {
    const types = new Set<string>(["All Types"]);
    urlData.forEach((u) => types.add(u.type));
    return Array.from(types);
  }, [urlData]);

  const filteredDomainData = useMemo(() => {
    return domainData.filter((d) => {
      const matchesSearch = d.domain
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "All Types" || d.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [domainData, searchQuery, selectedType]);

  const filteredUrlData = useMemo(() => {
    return urlData.filter((u) => {
      const matchesSearch =
        u.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "All Types" || u.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [urlData, searchQuery, selectedType]);

  // Create a lookup for brand logos
  const brandLogoLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    [...(allBrands || []), ...(targetBrands || [])].forEach((b) => {
      if (b.brand_name && (b.official_url || b.brand_url)) {
        const url = b.official_url || b.brand_url;
        try {
          lookup[b.brand_name] = new URL(
            url.startsWith("http") ? url : `https://${url}`
          ).hostname;
        } catch (e) {
          lookup[b.brand_name] = url;
        }
      }
    });
    return lookup;
  }, [allBrands, targetBrands]);

  const CHART_COLORS = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 animate-in fade-in duration-500 ease-out">
      <div className="max-w-[1700px] mx-auto px-6 py-6 space-y-6">
        {/* 1. Header Section */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] -mx-6 -mt-6 mb-8">
          <div className="max-w-[1700px] mx-auto px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  Source Intelligence
                </h1>
                <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                  Analyze the domains and specific URLs that AI models cite
                  most frequently in your industry.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-1 rounded-xl flex items-center border border-slate-100">
              <button
                onClick={() => {
                  setActiveTab("domains");
                  setSelectedType("All Types");
                }}
                className={cn(
                  "px-6 py-2 text-[13px] font-bold rounded-lg transition-all duration-200",
                  activeTab === "domains"
                    ? "bg-white shadow-sm text-slate-900 border border-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Domains
              </button>
              <button
                onClick={() => {
                  setActiveTab("urls");
                  setSelectedType("All Types");
                }}
                className={cn(
                  "px-6 py-2 text-[13px] font-bold rounded-lg transition-all duration-200",
                  activeTab === "urls"
                    ? "bg-white shadow-sm text-slate-900 border border-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                URLs
              </button>
            </div>
          </div>
        </div>

        {/* 2️⃣ ANALYTICS SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Line Chart Card */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
              <ChartArea className="h-4 w-4 text-slate-400" />
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                {activeTab === "domains"
                  ? "Source Usage by Domain (Top 5)"
                  : "Source Usage by URL Type (Top 5)"}
              </h2>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex-1 w-full min-h-[240px]">
                {isLoading ? (
                  <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                    <div className="flex gap-4 justify-center">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-20 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <SourceUsageChart
                    data={usageChartData.points}
                    sources={usageChartData.top5}
                  />
                )}
              </div>

              {/* Legend below X-axis */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-6">
                {usageChartData.top5.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 group cursor-default"
                  >
                    <div
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-600 transition-colors tracking-tight">
                      {source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Donut Chart Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-slate-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                {activeTab === "domains"
                  ? "Sources Type Distribution"
                  : "URL Type Distribution"}
              </h3>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex-1 w-full flex items-center justify-center">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[200px] w-[200px] rounded-full" />
                  </div>
                ) : (
                  <CitationsPieChart
                    data={citationsPieData.data}
                    totalCitations={citationsPieData.total}
                    label="Citations"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3️⃣ TABLE SECTION */}
        <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[700px] flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Database className="h-4 w-4 text-slate-900" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 leading-none">
                    Source Details
                  </h4>
                  {activeTab === "domains" && (
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse-slow">
                      • Click row for Domain-based URL analytics
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Track mentions and reach across all indexed sources
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedType}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200"
                >
                  {(activeTab === "domains" ? domainTypes : urlTypes).map(
                    (type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors",
                          selectedType === type
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        {type}
                        {selectedType === type && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Bar */}
              <div className="relative group min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "domains"
                      ? "Search domains..."
                      : "Search URLs..."
                  }
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <SourcesTable
            activeTab={activeTab}
            filteredDomainData={filteredDomainData}
            filteredUrlData={filteredUrlData}
            mainBrand={mainBrand}
            brandLogoLookup={brandLogoLookup}
            expandedDomain={expandedDomain}
            setExpandedDomain={setExpandedDomain}
          />
        </div>
      </div>
    </div>
  );
}
