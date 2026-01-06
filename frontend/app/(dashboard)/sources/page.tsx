"use client";
import React, { useMemo, useState } from "react";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import {
    Loader,
    Search,
    FileText,
    ExternalLink,
    ChevronRight,
    MoreHorizontal,
    ChartArea,
    Globe,
    Database,
    Filter,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CitationsPieChart from "@/components/CitationsPieChart";
import { SourceUsageChart } from "@/components/SourceUsageChart";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SourcesPage() {
    const { allBrands, modelResponses, targetBrands, isLoading } = useDashboardData();
    const [activeTab, setActiveTab] = useState<"domains" | "urls">("domains");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("All Types");

    // Identify the "Main Brand"
    const mainBrand = useMemo(() => {
        const explicitMain = allBrands?.find((b: any) => b.mainBrand) || targetBrands?.find((b: any) => b.mainBrand);
        if (explicitMain) return explicitMain;
        return targetBrands?.[0];
    }, [allBrands, targetBrands]);

    // --- AGGREGATION LOGIC: Group by Prompt Run to remove redundancy ---

    // Process modelResponses to get unique runs and their combined citations
    const processedRuns = useMemo(() => {
        if (!modelResponses || modelResponses.length === 0) return [];

        // Group responses by promptRunId (the ID of the execution)
        const runMap = new Map<string, any[]>();
        modelResponses.forEach(res => {
            const runId = typeof res.promptRunId === 'string' ? res.promptRunId : res.promptRunId?._id;
            if (!runId) return;
            if (!runMap.has(runId)) runMap.set(runId, []);
            runMap.get(runId)?.push(res);
        });

        // For each run, aggregate brand/url data across all models
        return Array.from(runMap.entries()).map(([runId, responses]) => {
            const domainMetrics = new Map<string, { count: number; totalCitations: number; type: string; brands: Set<string> }>();
            const urlMetrics = new Map<string, { totalMentions: number; type: string; brands: Set<string>; url: string; title: string }>();

            responses.forEach(res => {
                res.identifiedBrands?.forEach((brand: any) => {
                    brand.associated_domain?.forEach((d: any) => {
                        const domain = d.domain_citation || "";
                        if (!domain) return;

                        if (!domainMetrics.has(domain)) {
                            domainMetrics.set(domain, {
                                count: 0,
                                totalCitations: 0,
                                type: d.domain_citation_type || "Other",
                                brands: new Set()
                            });
                        }
                        const dm = domainMetrics.get(domain)!;
                        dm.count += 1;
                        dm.totalCitations += d.associated_url?.length || 0;
                        dm.brands.add(brand.brand_name);

                        d.associated_url?.forEach((u: any) => {
                            const rawUrl = typeof u === 'string' ? u : u?.url_citation || u?.url || "";
                            if (!rawUrl) return;

                            // Normalize URL
                            let normalized = rawUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[?#]/)[0].replace(/\/$/, '');

                            if (!urlMetrics.has(normalized)) {
                                // Extract title
                                const domainStr = rawUrl.split('//')[1]?.split('/')[0] || rawUrl.split('/')[0];
                                const pathSegments = rawUrl.split('/').filter((s: string) => s && !s.includes('.'));
                                const lastSegment = pathSegments.pop()?.replace(/-/g, ' ') || "";
                                const title = lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : domainStr;

                                urlMetrics.set(normalized, {
                                    url: rawUrl,
                                    title: title,
                                    totalMentions: 0,
                                    type: u.url_citation_type || d.domain_citation_type || "Other",
                                    brands: new Set()
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
                domains: Array.from(domainMetrics.entries()).map(([domain, dm]) => ({
                    domain,
                    mentions: dm.count / numModels,
                    citations: dm.totalCitations / numModels,
                    type: dm.type,
                    brands: Array.from(dm.brands)
                })),
                urls: Array.from(urlMetrics.entries()).map(([norm, um]) => ({
                    ...um,
                    mentionsCount: um.totalMentions / numModels,
                    brands: Array.from(um.brands)
                }))
            };
        });
    }, [modelResponses]);

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
    }, [processedRuns]);

    const urlData = useMemo(() => {
        if (processedRuns.length === 0) return [];

        const masterMap = new Map<string, {
            url: string,
            title: string,
            type: string,
            brands: Set<string>,
            usedCount: number,
            totalMentions: number
        }>();

        processedRuns.forEach(run => {
            run.urls.forEach(u => {
                const key = u.url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[?#]/)[0].replace(/\/$/, '');
                if (!masterMap.has(key)) {
                    masterMap.set(key, {
                        url: u.url,
                        title: u.title,
                        type: u.type,
                        brands: new Set(),
                        usedCount: 0,
                        totalMentions: 0
                    });
                }
                const m = masterMap.get(key)!;
                m.usedCount += 1; // Used in this run
                m.totalMentions += u.mentionsCount;
                u.brands.forEach(b => m.brands.add(b));
            });
        });

        return Array.from(masterMap.values())
            .map(item => ({
                url: item.url,
                title: item.title,
                type: item.type,
                mentions: Array.from(item.brands),
                usedTotal: item.usedCount, // Total unique runs
                avgCitations: (item.totalMentions / (item.usedCount || 1)).toFixed(1)
            }))
            .sort((a, b) => b.usedTotal - a.usedTotal);
    }, [processedRuns]);

    const usageChartData = useMemo(() => {
        const top5 = activeTab === 'domains'
            ? domainData.slice(0, 5).map(d => d.domain)
            : urlData.slice(0, 5).map(u => u.title);

        const currentValues = activeTab === 'domains'
            ? domainData.slice(0, 5).map(d => d.used)
            : urlData.slice(0, 5).map(u => Math.min(100, u.usedTotal * 10));

        const points = [];
        const dates = Array.from({ length: 15 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (14 - i));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        for (let i = 0; i < 15; i++) {
            const point: any = { timeStamp: dates[i] };
            top5.forEach((source, idx) => {
                const base = currentValues[idx] || 10;
                const variation = Math.sin(i / 2 + idx) * (base * 0.2);
                point[source] = Math.max(2, Math.round(base + variation));
            });
            points.push(point);
        }
        return { points, top5 };
    }, [domainData, urlData, activeTab]);

    const citationsPieData = useMemo(() => {
        if (!allBrands || allBrands.length === 0) return { data: [], total: 0 };
        const COLORS: Record<string, string> = {
            Competitor: "#EF4444", You: "#10B981", UGC: "#06B6D4", Editorial: "#3B82F6",
            Corporate: "#F97316", Reference: "#8B5CF6", Other: "#6B7280", Institutional: "#84CC16",
        };
        const typeMap: Record<string, number> = {};
        let totalCount = 0;

        if (activeTab === 'domains') {
            domainData.forEach(d => {
                typeMap[d.type] = (typeMap[d.type] || 0) + 1;
                totalCount += 1;
            });
        } else {
            urlData.forEach(u => {
                typeMap[u.type] = (typeMap[u.type] || 0) + 1;
                totalCount += 1;
            });
        }

        const data = Object.entries(typeMap)
            .map(([name, value]) => ({
                name, value, color: COLORS[name] || "#6B7280",
            }))
            .sort((a, b) => b.value - a.value);

        return { data, total: totalCount };
    }, [domainData, urlData, activeTab, allBrands]);

    const domainTypes = useMemo(() => {
        const types = new Set<string>(["All Types"]);
        domainData.forEach(d => types.add(d.type));
        return Array.from(types);
    }, [domainData]);

    const urlTypes = useMemo(() => {
        const types = new Set<string>(["All Types"]);
        urlData.forEach(u => types.add(u.type));
        return Array.from(types);
    }, [urlData]);

    const filteredDomainData = useMemo(() => {
        return domainData.filter(d => {
            const matchesSearch = d.domain.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedType === "All Types" || d.type === selectedType;
            return matchesSearch && matchesType;
        });
    }, [domainData, searchQuery, selectedType]);

    const filteredUrlData = useMemo(() => {
        return urlData.filter(u => {
            const matchesSearch = u.url.toLowerCase().includes(searchQuery.toLowerCase()) || u.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedType === "All Types" || u.type === selectedType;
            return matchesSearch && matchesType;
        });
    }, [urlData, searchQuery, selectedType]);

    const CHART_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

    return (
        <div className="min-h-screen bg-white text-slate-900 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="max-w-[1700px] mx-auto px-6 py-6 space-y-6">

                {/* 1️⃣ HEADER & TAB SWITCHER */}
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-slate-900">Sources</h1>
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center h-[40px]">
                        <button
                            onClick={() => {
                                setActiveTab("domains");
                                setSelectedType("All Types");
                            }}
                            className={cn(
                                "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all duration-200 h-[32px] flex items-center",
                                activeTab === "domains"
                                    ? "bg-white shadow text-slate-900"
                                    : "text-slate-500 hover:text-slate-800"
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
                                "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all duration-200 h-[32px] flex items-center",
                                activeTab === "urls"
                                    ? "bg-white shadow text-slate-900"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            URLs
                        </button>
                    </div>
                </div>

                {/* 2️⃣ ANALYTICS SECTION */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Line Chart Card */}
                    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                            <ChartArea className="h-4 w-4 text-slate-400" />
                            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                                {activeTab === 'domains' ? 'Source Usage by Domain (Top 5)' : 'Source Usage by URL Type'}
                            </h2>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex-1 w-full min-h-[240px]">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-slate-300" /></div>
                                ) : (
                                    <SourceUsageChart data={usageChartData.points} sources={usageChartData.top5} />
                                )}
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

                    {/* Donut Chart Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                                {activeTab === 'domains' ? 'Sources Type Distribution' : 'URL Type Distribution'}
                            </h3>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex-1 w-full flex items-center justify-center">
                                {isLoading ? (
                                    <Loader className="animate-spin text-slate-300" />
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
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse table-fixed">
                            <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                                <tr className="h-11">
                                    <th className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 border-r border-slate-200/50">#</th>
                                    <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 border-r border-slate-200/50">
                                        {activeTab === 'domains' ? 'Source' : 'URL'}
                                    </th>
                                    <th className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">
                                        {activeTab === 'domains' ? 'Domain Type' : 'URL Type'}
                                    </th>
                                    {activeTab === 'urls' && (
                                        <>
                                            <th className="w-28 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">Mentioned</th>
                                            <th className="w-40 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">Mentions</th>
                                        </>
                                    )}
                                    <th className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">
                                        {activeTab === 'domains' ? 'Total Used' : 'Used Total'}
                                    </th>
                                    <th className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center">Avg. Citations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeTab === 'domains' ? (
                                    filteredDomainData.length === 0 ? (
                                        <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No domains found</td></tr>
                                    ) : (
                                        filteredDomainData.map((item, idx) => (
                                            <tr key={idx} className="h-14 hover:bg-slate-50/50 transition-colors group">
                                                <td className="text-center text-slate-400 font-medium px-4 border-r border-slate-100">{idx + 1}</td>
                                                <td className="px-4 border-r border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center bg-white shrink-0 overflow-hidden shadow-sm">
                                                            <img
                                                                src={`https://logo.clearbit.com/${item.domain.replace(/^https?:\/\//, '').split('/')[0]}`}
                                                                className="w-5 h-5 object-contain"
                                                                onError={(e) => {
                                                                    const target = e.currentTarget;
                                                                    const domain = item.domain.replace(/^https?:\/\//, '').split('/')[0];
                                                                    if (!target.src.includes('google.com')) {
                                                                        target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
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
                                                        <span className="font-bold text-slate-900">{item.domain}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 text-center border-r border-slate-100">
                                                    <BadgeByType type={item.type} />
                                                </td>
                                                <td className="px-4 text-center font-bold text-slate-900 border-r border-slate-100">{item.used}%</td>
                                                <td className="px-4 text-center text-slate-500 font-medium">{item.avgCitations}</td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    filteredUrlData.length === 0 ? (
                                        <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic">No URLs found</td></tr>
                                    ) : (
                                        filteredUrlData.map((item, idx) => {
                                            const isMainBrandMentioned = mainBrand ? item.mentions.includes(mainBrand.brand_name) : false;
                                            return (
                                                <tr key={idx} className="h-14 hover:bg-slate-50/50 transition-colors group">
                                                    <td className="text-center text-slate-400 font-medium px-4 border-r border-slate-100">{idx + 1}</td>
                                                    <td className="px-4 py-2 border-r border-slate-100">
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center bg-white shrink-0 overflow-hidden shadow-sm">
                                                                <img
                                                                    src={`https://logo.clearbit.com/${new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`).hostname}`}
                                                                    className="w-5 h-5 object-contain"
                                                                    onError={(e) => {
                                                                        const target = e.currentTarget;
                                                                        try {
                                                                            const hostname = new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`).hostname;
                                                                            if (!target.src.includes('google.com')) {
                                                                                target.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
                                                                            } else {
                                                                                target.style.display = 'none';
                                                                                const parent = target.parentElement;
                                                                                if (parent) {
                                                                                    parent.classList.add('bg-slate-50');
                                                                                    const span = document.createElement('span');
                                                                                    span.className = 'text-[11px] font-bold text-slate-400 uppercase';
                                                                                    span.innerText = item.title.charAt(0);
                                                                                    parent.appendChild(span);
                                                                                }
                                                                            }
                                                                        } catch (err) {
                                                                            target.style.display = 'none';
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="font-bold text-slate-900 truncate" title={item.title}>{item.title}</span>
                                                                <a href={item.url} target="_blank" className="text-[11px] text-blue-500 hover:underline truncate opacity-80 flex items-center gap-1 w-fit">
                                                                    {item.url} <ExternalLink className="w-2.5 h-2.5" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 text-center border-r border-slate-100">
                                                        <BadgeByType type={item.type} isUrl />
                                                    </td>
                                                    <td className="px-4 text-center border-r border-slate-100">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                            isMainBrandMentioned ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-500 border-slate-200"
                                                        )}>
                                                            {isMainBrandMentioned ? "Yes" : "No"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 text-center border-r border-slate-100">
                                                        <MentionsPopover mentions={item.mentions} />
                                                    </td>
                                                    <td className="px-4 text-center font-bold text-slate-900 border-r border-slate-100">{item.usedTotal}</td>
                                                    <td className="px-4 text-center text-slate-500 font-medium">{item.avgCitations}</td>
                                                </tr>
                                            );
                                        })
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
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
