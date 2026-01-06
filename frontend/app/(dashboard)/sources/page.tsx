"use client";
import { brandAPI } from "@/api/brand.api";
import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { Loader, Globe, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { VisibilityChart } from "@/components/VisibilityChart";
import CitationsPieChart from "@/components/CitationsPieChart";

function SourcesPage() {
    const { activeWorkspace } = useWorkspace();
    const [brands, setBrands] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    

    

    useEffect(() => {
        setIsLoading(true);
        loadBrands();
    }, [activeWorkspace?._id]);

    
    const loadBrands = async () => {
        try {
            const res = await brandAPI.getBrands();
            setBrands(res.data);
        } catch (error) {
            toast.error("Failed to load brands/sources.");
        } finally {
            setIsLoading(false);
        }
    };

    const domainData = useMemo(() => {
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
            .sort((a, b) => b.used - a.used);
    }, [brands]);

    const usageTrendData = useMemo(() => {
        const trend: any[] = [];
        brands.forEach((brand) => {
            brand.associated_domain?.forEach((domainData: any) => {
                const domain = domainData.domain_citation;
                if (domain) {
                    trend.push({
                        name: domain,
                        mentions: domainData.associated_url?.length || 1,
                        timeStamp: new Date(brand.updatedAt || Date.now()).toLocaleDateString('en-GB')
                    });
                }
            });
        });
        return trend;
    }, [brands]);

    const domainPieData = useMemo(() => {
        if (!brands || brands.length === 0) return { data: [], total: 0 };

        const domainCounts: Record<string, number> = {};
        let totalCount = 0;

        brands.forEach((brand) => {
            brand.associated_domain?.forEach((domainData: any) => {
                const domain = domainData.domain_citation;
                if (domain) {
                    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
                    totalCount++;
                }
            });
        });

        // Sort by count
        const sortedDomains = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1]);

        // Take top 5 and group others
        const topDomains = sortedDomains.slice(0, 5);
        const otherCount = sortedDomains.slice(5).reduce((acc, [, count]) => acc + count, 0);

        const COLORS = [
          "#60A5FA", "#34D399", "#818CF8", "#22D3EE", "#FACC15", "#FB7185", 
          "#A78BFA", "#E879F9", "#2DD4BF", "#FB923C"
        ];

        const data = topDomains.map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }));

        if (otherCount > 0) {
            data.push({
                name: "Other",
                value: otherCount,
                color: "#9CA3AF" // Gray
            });
        }

        return { data, total: totalCount };
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

    return (
        <div className="min-h-screen">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="hover:bg-muted p-1.5 rounded-full transition-colors mr-1">
                            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                        </Link>
                        <Globe className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">All Sources</h1>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                      {/* Main Chart Card */}
                      <div className="xl:col-span-7 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[400px]">
                        <div className="p-4 border-b border-border flex flex-row justify-between items-center shrink-0 bg-muted/20">
                          <div className="flex items-center gap-2">
                            {/* <Eye className="h-4 w-4 text-muted-foreground/70" /> */}
                            <h3 className="text-sm font-semibold text-muted-foreground">Source Usage by domain</h3>
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
                              className="w-full h-full animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ease-out fill-mode-both"
                            >
                                <VisibilityChart data={usageTrendData} />
                            </div>
                          )}
                        </div>
                      </div>
            
                      

                      {/* Sources Type Card */}
                      <div className="xl:col-span-5 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[400px]">
                        <div className="p-4 border-b border-border bg-muted/20">
                          <h3 className="font-bold text-[11px] uppercase tracking-wider text-foreground">Sources Type</h3>
                        </div>
                        <div className="p-5 flex items-center justify-center flex-1">
                          {isLoading ? (
                            <div className="flex flex-col items-center gap-3 text-foreground/40">
                              <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                              <p className="text-sm font-medium">Analyzing sources...</p>
                            </div>
                          ) : (
                            <div className="w-full h-full animate-in fade-in zoom-in-95 duration-700">
                              <CitationsPieChart
                                data={citationsPieData.data}
                                totalCitations={citationsPieData.total}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

            <div className="max-w-5xl pl-4 pt-4 mb-8 rounded-2xl border ml-4 bg-white mt-3 overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="p-4 border-b border-border flex items-center bg-muted/20">
                    <div className="min-w-[300px] flex items-center gap-2">
                        <h4 className="font-bold text-[11px] uppercase tracking-wider text-foreground">Domain</h4>
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4">
                        <div className="hidden md:flex items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <span className="w-24 text-center">Used</span>
                            <span className="w-32 text-center px-2">Avg. Citations</span>
                            <span className="w-32 text-center">Type</span>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-border/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-3 text-foreground/40">
                            <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
                            <p className="text-sm font-medium">Fetching sources...</p>
                        </div>
                    ) : domainData.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground font-medium">
                            No sources or domains found for this workspace.
                        </div>
                    ) : (
                        domainData.map((item: any, index: number) => (
                            <div key={index} className="flex items-center p-3 hover:bg-muted/40 transition-colors text-sm group">
                                <div className="flex items-center gap-3 min-w-[300px]">
                                    <div className="h-9 w-9 rounded-xl border border-border/50 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
                                        <img
                                            src={`https://logo.clearbit.com/${item.domain}`}
                                            alt={item.domain}
                                            className="h-5 w-5 object-contain"
                                            onError={(e) => {
                                                (e.target as any).style.display = 'none';
                                                const parent = (e.target as any).parentElement;
                                                if (parent) {
                                                    parent.classList.add('bg-muted/50');
                                                    parent.innerHTML = `<span class="text-[12px] font-bold text-muted-foreground">${item.domain.charAt(0).toUpperCase()}</span>`;
                                                }
                                            }}
                                        />
                                    </div>
                                    <span className="font-semibold text-foreground text-sm tracking-tight">{item.domain}</span>
                                </div>

                                <div className="flex-1 flex items-center justify-end px-4">
                                    <div className="hidden md:flex items-center">
                                        <div className="w-24 text-center font-bold text-foreground text-sm">{item.used}%</div>
                                        <div className="w-32 text-center text-muted-foreground text-sm px-2 font-medium">{item.avgCitations}</div>
                                        <div className="w-32 flex justify-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-md text-[11px] font-bold border text-center min-w-[90px]",
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
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default SourcesPage;
