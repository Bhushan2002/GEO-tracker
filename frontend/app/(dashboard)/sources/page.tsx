"use client";
import { brandAPI } from "@/api/brand.api";
import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { Loader, Globe, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
        if (processedRuns.length === 0) return [];

        const masterMap = new Map<string, {
            usedCount: number;
            totalMentions: number;
            totalCitations: number;
            type: string;
            brands: Set<string>
        }>();

        processedRuns.forEach(run => {
            run.domains.forEach(d => {
                if (!masterMap.has(d.domain)) {
                    masterMap.set(d.domain, {
                        usedCount: 0,
                        totalMentions: 0,
                        totalCitations: 0,
                        type: d.type,
                        brands: new Set()
                    });
                }
                const m = masterMap.get(d.domain)!;
                m.usedCount += 1; // It was used in this run
                m.totalMentions += d.mentions;
                m.totalCitations += d.citations;
                d.brands.forEach(b => m.brands.add(b));
            });
        });

        const totalRuns = processedRuns.length || 1;

        return Array.from(masterMap.entries())
            .map(([domain, data]) => ({
                domain,
                used: Math.round((data.usedCount / totalRuns) * 100),
                avgCitations: (data.totalCitations / (data.usedCount || 1)).toFixed(1),
                type: data.type,
                brands: Array.from(data.brands)
            }))
            .sort((a, b) => b.used - a.used);
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

                            {/* Legend below X-axis */}
                            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-6">
                                {usageChartData.top5.map((source, i) => (
                                    <div key={i} className="flex items-center gap-1.5 group cursor-default">
                                        <div
                                            className="w-2 h-2 rounded-full shadow-sm"
                                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                        />
                                        <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-600 transition-colors tracking-tight">
                                            {source}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4">
                        <div className="flex items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:flex">
                            <span className="w-24 text-center">Used</span>
                            <span className="w-32 text-center px-2">Avg. Citations</span>
                            <span className="w-32 text-center">Type</span>
                        </div>
                    </div>
                </div>

                {/* 3️⃣ TABLE SECTION */}
                <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                <Database className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 leading-none">Source Details</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Track mentions and reach across all indexed sources</p>
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
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200">
                                    {(activeTab === 'domains' ? domainTypes : urlTypes).map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={cn(
                                                "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                                                selectedType === type ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            {type}
                                            {selectedType === type && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Search Bar */}
                            <div className="relative group min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'domains' ? "Search domains..." : "Search URLs..."}
                                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
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
                                    <div className="flex items-center hidden md:flex">
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

function BadgeByType({ type, isUrl }: { type: string, isUrl?: boolean }) {
    const styles = {
        Competitor: "bg-red-50 text-red-600 border-red-100",
        You: "bg-green-50 text-green-600 border-green-100",
        Editorial: "bg-blue-50 text-blue-600 border-blue-100",
        Institutional: "bg-purple-50 text-purple-600 border-purple-100",
        Article: "bg-cyan-50 text-cyan-600 border-cyan-100",
        Comparison: "bg-indigo-50 text-indigo-600 border-indigo-100",
        "How-to Guide": "bg-emerald-50 text-emerald-600 border-emerald-100",
        Listicle: "bg-blue-50 text-blue-600 border-blue-100",
    } as any;

    const style = styles[type] || "bg-slate-50 text-slate-500 border-slate-200";

    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[11px] font-bold border",
            style
        )}>
            {type}
        </span>
    );
}

function MentionsPopover({ mentions }: { mentions: string[] }) {
    if (!mentions || mentions.length === 0) return <span className="text-slate-300">-</span>;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center justify-center cursor-pointer group/mentions">
                    <div className="flex -space-x-2">
                        {mentions.slice(0, 3).map((brand, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border border-white bg-white shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover/mentions:translate-x-0.5 first:group-hover/mentions:translate-x-0">
                                <img
                                    src={`https://logo.clearbit.com/${brand.toLowerCase().replace(/\s+/g, '')}.com`}
                                    className="w-3.5 h-3.5 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-slate-400">${brand.charAt(0)}</span>`;
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {mentions.length > 3 && (
                        <span className="text-[11px] font-bold text-slate-400 ml-2">+{mentions.length - 3}</span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200" align="center">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-900">Mentioned Brands</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">{mentions.length}</span>
                </div>
                <div className="p-1 max-h-[240px] overflow-auto custom-scrollbar">
                    {mentions.map((brand, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-colors group cursor-default">
                            <div className="w-6 h-6 rounded-md border border-slate-100 flex items-center justify-center bg-white overflow-hidden shadow-sm">
                                <img
                                    src={`https://logo.clearbit.com/${brand.toLowerCase().replace(/\s+/g, '')}.com`}
                                    className="w-3.5 h-3.5 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-slate-400">${brand.charAt(0)}</span>`;
                                    }}
                                />
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{brand}</span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default SourcesPage;
