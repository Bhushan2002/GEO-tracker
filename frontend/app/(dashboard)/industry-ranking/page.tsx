"use client";
import { brandAPI } from "@/lib/api/brand.api";
import { DashBrandTable } from "@/components/Brands/DashboardBrandTable";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ChevronLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

import { useDashboardData } from "@/lib/contexts/dashboard-data-context";

function IndustryRankingPage() {
    const { allBrands, isLoading } = useDashboardData();
    const [brands, setBrands] = useState<any[]>([]);

    useEffect(() => {
        if (allBrands.length > 0) {
            const data = [...allBrands].sort((a: any, b: any) => {
                if (a.lastRank !== b.lastRank) return a.lastRank - b.lastRank;
                return b.mentions - a.mentions;
            });
            setBrands(data);
        }
    }, [allBrands]);

    return (
        <div className="min-h-screen">
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="px-8 py-5 flex items-center justify-between max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:bg-slate-50 p-2 rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                            <ChevronLeft className="h-5 w-5 text-slate-400 group-hover:text-slate-900" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Industry Ranking</h1>
                            <p className="text-[13px] text-slate-500 mt-1.5 font-medium max-w-2xl">
                                Real-time leaderboard of brand performance metrics, visibility share, and AI sentiment analysis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-8">
                <div className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <DashBrandTable data={brands} loading={isLoading} />
                </div>
            </div>
        </div>
    );
}

export default IndustryRankingPage;
