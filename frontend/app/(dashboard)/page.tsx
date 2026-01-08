"use client";

import { DashBrandTable } from "@/components/Brands/DashboardBrandTable";
import { ModelResponsesTable } from "@/components/ModelResponsesTable";
import PieChartComponent from "@/components/Charts/pieChart";
import CitationsPieChart from "@/components/Charts/CitationsPieChart";

import { VisibilityChart } from "@/components/Charts/VisibilityChart";

import { PositionChart } from "@/components/Charts/PositionChart";
import Link from "next/link";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SentimentChart } from "@/components/Charts/SentimentChart";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import {
  Globe,
  ChevronRight,
  Eye,
  Loader,
  ChartArea,
  MessageCircle,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import DomainTable from "@/components/Charts/DomainTable";

export default function Overview() {
  const { activeWorkspace } = useWorkspace();
  const { allBrands, brandHistory, isLoading, refreshAll } = useDashboardData();

  const [topBrands, setTopBrands] = useState<any[]>([]);
  const [mentionsData, setMentionsData] = useState<any[]>([]);
  const [sentimentsData, setSentimentsData] = useState<any[]>([]);
  const [positionData, setPositionData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'mentions' | 'sentiments' | 'position'>('mentions');

  useEffect(() => {
    if (allBrands.length > 0) {
      const top10 = [...allBrands].sort((a: any, b: any) => {
        if (chartType === 'mentions') {
          return (b.mentions || 0) - (a.mentions || 0);
        } else if (chartType === 'sentiments') {
          const sA = (a.sentiment_score <= 10 ? a.sentiment_score * 10 : a.sentiment_score) || 0;
          const sB = (b.sentiment_score <= 10 ? b.sentiment_score * 10 : b.sentiment_score) || 0;
          return sB - sA;
        } else {
          return (a.lastRank || 999) - (b.lastRank || 999);
        }
      }).slice(0, 7);
      setTopBrands(top10);
    }
  }, [allBrands, chartType]);

  useEffect(() => {
    if (brandHistory.length > 0) {
      setMentionsData(brandHistory);
      setSentimentsData(brandHistory);
      setPositionData(brandHistory);
    }
  }, [brandHistory]);

  const domainTableData = React.useMemo(() => {
    if (!allBrands || allBrands.length === 0) return [];

    const domainMap: Record<
      string,
      { count: number; citations: number; type: string }
    > = {};
    let totalLinks = 0;

    allBrands.forEach((brand) => {
      brand.associated_domain?.forEach((domainData: any) => {
        try {
          const domain = domainData.domain_citation || "";
          const urlCount = domainData.associated_url?.length || 0;

          if (!domainMap[domain]) {
            domainMap[domain] = {
              count: 0,
              citations: 0,
              type: domainData.domain_citation_type || "Other",
            };
          }

          domainMap[domain].count += 1;
          domainMap[domain].citations += urlCount;
          totalLinks++;
        } catch (e) {
          /* ignore invalid data */
        }
      });
    });

    return Object.entries(domainMap)
      .map(([domain, data]) => ({
        domain,
        used: Math.round((data.count / totalLinks) * 100),
        avgCitations: (data.citations / data.count).toFixed(1),
        type: data.type
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 10);
  }, [allBrands]);

  const citationsPieData = React.useMemo(() => {
    if (!allBrands || allBrands.length === 0) return { data: [], total: 0 };

    const CITATION_COLORS: Record<string, string> = {
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
    const uniqueDomains = new Set<string>();

    allBrands.forEach((brand) => {
      brand.associated_domain?.forEach((domainData: any) => {
        const domain = domainData.domain_citation || "";
        const type = domainData.domain_citation_type || "Other";

        // Only count each unique domain once
        if (domain && !uniqueDomains.has(domain)) {
          uniqueDomains.add(domain);
          typeMap[type] = (typeMap[type] || 0) + 1;
        }
      });
    });

    const totalCitations = uniqueDomains.size;

    const data = Object.entries(typeMap)
      .map(([name, value]) => ({
        name,
        value,
        color: CITATION_COLORS[name] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);

    return { data, total: totalCitations };
  }, [allBrands]);


  return (
    <div className="min-h-screen p-6 space-y-8 max-w-[1700px] mx-auto">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] -mx-6 -mt-6 mb-8">
        <div className="max-w-[1700px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Dashboard Overview</h1>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                Monitor keyword performance, brand visibility, and AI trends across your workspace.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={cn("space-y-8", !isLoading && "animate-in fade-in duration-500 ease-out")}>
        {/* Top Row: Visibility Chart and Brand Table */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Chart Card */}
          <div className="xl:col-span-7 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-400" />
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  {chartType === 'mentions' ? 'Visibility' : chartType === 'sentiments' ? 'Sentiment' : 'Position'}
                </h3>
                <span className="text-slate-300 mx-1.5">•</span>
                <p className="text-[10px] text-slate-500 font-medium">
                  {chartType === 'mentions' ? 'Percentage of chats' :
                    chartType === 'sentiments' ? 'Average sentiment' : 'Average ranking'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex bg-white rounded-lg border border-border overflow-hidden shadow-sm">
                  <button
                    onClick={() => setChartType('mentions')}
                    className={cn(
                      "px-4 py-1.5 text-[13px] font-bold transition-all border-r border-border",
                      chartType === 'mentions' ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    Mentions
                  </button>
                  <button
                    onClick={() => setChartType('sentiments')}
                    className={cn(
                      "px-4 py-1.5 text-[13px] font-bold transition-all border-r border-border",
                      chartType === 'sentiments' ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    Sentiments
                  </button>
                  <button
                    onClick={() => setChartType('position')}
                    className={cn(
                      "px-4 py-1.5 text-[13px] font-bold transition-all",
                      chartType === 'position' ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    Positions
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 pt-2 flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-foreground/40">
                  <Loader className="h-10 w-10 animate-spin text-foreground shrink-0" strokeWidth={1.5} />
                  <p className="text-sm font-medium">Crunching analytics...</p>
                </div>
              ) : (
                <div
                  key={chartType}
                  className="w-full h-full animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ease-out fill-mode-both"
                >
                  {chartType === 'mentions' && <VisibilityChart data={mentionsData} />}
                  {chartType === 'sentiments' && <SentimentChart data={sentimentsData} />}
                  {chartType === 'position' && <PositionChart data={positionData} />}
                </div>
              )}
            </div>
          </div>

          {/* Industry Ranking Card */}
          <div className="xl:col-span-5 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Industry Ranking
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Displaying top 10 performers</p>
              </div>
              <Link href="/industry-ranking" className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1 px-2.5 py-1 hover:bg-white rounded-md border border-transparent hover:border-slate-200">
                Show All <ChevronRight className="h-3 w-3" strokeWidth={3} />
              </Link>
            </div>
            <div className="p-0 flex-1 overflow-auto min-h-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-foreground/40">
                  <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                  <p className="text-sm font-medium">Ranking market leaders...</p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <DashBrandTable data={topBrands} loading={false} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Top Sources Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Top Sources</h3>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">• Sources across active models</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Sources Doughnut */}
            <div className="xl:col-span-4 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">Sources Type</h3>
              </div>
              <div className="p-5 flex items-center justify-center min-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 text-foreground/40">
                    <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                    <p className="text-sm font-medium">Analyzing sources...</p>
                  </div>
                ) : (
                  <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                    <CitationsPieChart
                      data={citationsPieData.data}
                      totalCitations={citationsPieData.total}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Domain Table */}

            <DomainTable domainTableData={domainTableData} isLoading={isLoading} />

            <div className="xl:col-span-8 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">Top Domains</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Displaying top 10 sources</p>
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:flex">
                  <span className="w-16 text-center">Used</span>
                  <span className="w-28 text-center px-2">Avg. Citations</span>
                  <span className="w-24 text-center">Type</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto min-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground/40">
                    <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                    <p className="text-sm font-medium">Fetching domain insights...</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    {domainTableData.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="flex items-center h-12 px-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors text-sm group">
                        <div className="flex items-center gap-3 min-w-[240px] border-r border-slate-50 h-full">
                          <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                            <img
                              src={`https://logo.clearbit.com/${item.domain.replace(/^https?:\/\//, '').split('/')[0]}`}
                              alt={item.domain}
                              className="h-4 w-4 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const domain = item.domain.replace(/^https?:\/\//, '').split('/')[0];
                                if (!target.src.includes('google.com')) {
                                  target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                                } else {
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.classList.add('bg-slate-50');
                                    parent.innerHTML = `<span class="text-[9px] font-bold text-slate-400 capitalize">${item.domain.charAt(0)}</span>`;
                                  }
                                }
                              }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 truncate text-[13px]">{item.domain}</span>
                        </div>

                        <div className="flex-1 flex items-center justify-end px-4 h-full">
                          <div className="flex items-center hidden md:flex h-full">
                            <div className="w-16 text-center font-bold text-slate-900 text-[13px] border-r border-slate-50 h-full flex items-center justify-center">{item.used}%</div>
                            <div className="w-28 text-center text-slate-500 font-medium text-[13px] px-2 border-r border-slate-50 h-full flex items-center justify-center">{item.avgCitations}</div>
                            <div className="w-24 flex justify-center h-full flex items-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-[10px] font-bold border text-center min-w-[75px] capitalize",
                                item.type.toLowerCase() === 'competitor' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                  item.type.toLowerCase() === 'you' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    item.type.toLowerCase() === 'ugc' ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                                      item.type.toLowerCase() === 'editorial' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        "bg-slate-50 text-slate-600 border-slate-100"
                              )}>
                                {item.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {domainTableData.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        No domain data available
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex justify-end shrink-0">
                <Link href="/sources" className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-sm">
                  Detailed Source Analytics <ChevronRight className="h-3 w-3" strokeWidth={3} />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Third Row: AI Model Responses */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Recent Chats</h3>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">• AI model interactions and responses</span>
          </div>

          <div className="w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground/40 bg-card rounded-xl border border-border border-dashed">
                <Loader className="h-10 w-10 animate-spin text-foreground shrink-0" strokeWidth={1.5} />
                <p className="text-sm font-medium">Fetching AI responses...</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-1000">
                <ModelResponsesTable />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
