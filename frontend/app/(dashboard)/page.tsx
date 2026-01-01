"use client";
import { brandAPI } from "@/api/brand.api";
import { DashBrandTable } from "@/components/dash-brandTable";
import { ModelResponsesTable } from "@/components/ModelResponsesTable";
import PieChartComponent from "@/components/pieChart";
import CitationsPieChart from "@/components/CitationsPieChart";

import { VisibilityChart } from "@/components/VisibilityChart";

import { PositionChart } from "@/components/PositionChart";
import Link from "next/link";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SentimentChart } from "@/components/SentimentChart";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import {
  LayoutDashboard,
  Calendar,
  Tag,
  Globe,
  BarChart3,
  ChevronRight,
  Download,
  Info,
  MessageSquare,
  Eye,
  Upload,
  Loader
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Overview() {
  const { activeWorkspace } = useWorkspace();
  const [brands, setBrands] = useState<any[]>([]);
  const [topBrands, setTopBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mentionsData, setMentionsData] = useState<any[]>([]);
  const [sentimentsData, setSentimentsData] = useState<any[]>([]);
  const [positionData, setPositionData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'mentions' | 'sentiments' | 'position'>('mentions');

  const domainTableData = React.useMemo(() => {
    if (!brands || brands.length === 0) return [];

    const domainMap: Record<
      string,
      { count: number; citations: number; type: string }
    > = {};
    let totalLinks = 0;

    brands.forEach((brand) => {
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
      .slice(0, 6);
  }, [brands]);

  const citationsPieData = React.useMemo(() => {
    if (!brands || brands.length === 0) return { data: [], total: 0 };

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

    brands.forEach((brand) => {
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
  }, [brands]);

  const fetchMentionsData = async () => {
    try {
      const response = await brandAPI.getBrandHistory(30);
      setMentionsData(response.data);
    } catch (error) {
      console.error("Failed to load mentions data:", error);
    }
  };

  const fetchSentimentsData = async () => {
    try {
      const response = await brandAPI.getBrandHistory(30);
      setSentimentsData(response.data);
    } catch (error) {
      console.error("Failed to load sentiments data:", error);
    }
  };

  const fetchPositionData = async () => {
    try {
      const response = await brandAPI.getBrandHistory(30);
      setPositionData(response.data);
    } catch (error) {
      console.error("Failed to load position data:", error);
    }
  };

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getBrands();
      setBrands(res.data);
      const top10 = res.data.slice(0, 10).sort((a: any, b: any) => {
        if (a.lastRank !== b.lastRank) return a.lastRank - b.lastRank;
        return b.mentions - a.mentions;
      });
      setTopBrands(top10);
    } catch (error) {
      toast.error("Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadBrands();
    fetchMentionsData();
    fetchSentimentsData();
    fetchPositionData();
  }, [activeWorkspace?._id]);


  return (
    <div className="min-h-screen p-6 space-y-8 max-w-[1700px] mx-auto">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="space-y-8">
        {/* Top Row: Visibility Chart and Brand Table */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Chart Card */}
          <div className="xl:col-span-7 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="p-4 border-b border-border flex flex-row justify-between items-center shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground/70" />
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-foreground">
                  {chartType === 'mentions' ? 'Visibility' : chartType === 'sentiments' ? 'Sentiment' : 'Position'}
                </h3>
                <span className="text-muted-foreground/50 mx-0.5 mt-0.5">•</span>
                <p className="text-[10px] text-muted-foreground font-medium">
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
          <div className="xl:col-span-5 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="p-4 border-b border-border flex flex-row justify-between items-center shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-foreground">
                  Industry Ranking
                </h3>
              </div>
              <Link href="/brand/all-brands" className="text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 px-2 py-1 hover:bg-white rounded-md border border-transparent hover:border-border">
                Show All <ChevronRight className="h-3 w-3" strokeWidth={3} />
              </Link>
            </div>
            <div className="p-0 flex-1 overflow-auto min-h-0">
              <DashBrandTable data={topBrands} loading={isLoading} />
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
            <div className="xl:col-span-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-foreground">Sources Type</h3>
              </div>
              <div className="p-5 flex items-center justify-center min-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 text-foreground/40">
                    <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                    <p className="text-sm font-medium">Analyzing sources...</p>
                  </div>
                ) : (
                  <CitationsPieChart
                    data={citationsPieData.data}
                    totalCitations={citationsPieData.total}
                  />
                )}
              </div>
            </div>

            {/* Domain Table */}
            <div className="xl:col-span-8 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-foreground">Domain</h4>
                </div>
                <div className="flex items-center gap-8 text-[11px] font-bold text-muted-foreground uppercase mr-12 hidden md:flex">
                  <span className="tracking-wider">Used</span>
                  <span className="tracking-wider">Avg. Citations</span>
                  <span className="tracking-wider">Type</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {domainTableData.slice(0, 6).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/80 transition-colors text-sm">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0">
                        <img
                          src={`https://logo.clearbit.com/${item.domain}`}
                          alt={item.domain}
                          className="h-4 w-4 object-contain"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                            const parent = (e.target as any).parentElement;
                            if (parent) {
                              parent.classList.add('bg-muted/50');
                              parent.innerHTML = `<span class="text-[10px] font-bold text-muted-foreground">${item.domain.charAt(0).toUpperCase()}</span>`;
                            }
                          }}
                        />
                      </div>
                      <span className="font-medium text-foreground truncate">{item.domain}</span>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="w-12 text-right font-semibold text-foreground">{item.used}%</div>
                      <div className="w-12 text-center text-muted-foreground">{item.avgCitations}</div>
                      <div className="w-20 flex justify-end">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border text-center min-w-[70px]",
                          item.type === 'Competitor' ? "bg-red-50 text-red-700 border-red-100" :
                            item.type === 'You' ? "bg-green-50 text-green-700 border-green-100" :
                              item.type === 'UGC' ? "bg-cyan-50 text-cyan-700 border-cyan-100" :
                                item.type === 'Editorial' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                  "bg-gray-50 text-gray-700 border-gray-100"
                        )}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground/40">
                    <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                    <p className="text-sm font-medium">Fetching domain insights...</p>
                  </div>
                ) : (
                  domainTableData.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No domain data available
                    </div>
                  )
                )}
              </div>
              <div className="p-2 border-t border-border bg-muted/10 text-right">
                <Link href="#" className="flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-4 py-1">
                  Show All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row: AI Model Responses */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-foreground">AI Model Responses</h3>
              <span className="text-sm text-muted-foreground">Detailed insights from different AI models</span>
            </div>
          </div>

          <div className="w-full">
            <ModelResponsesTable />
          </div>
        </div>

      </div>
    </div>
  );
}
