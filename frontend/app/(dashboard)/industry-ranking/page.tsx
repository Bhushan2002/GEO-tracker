"use client";
import { brandAPI } from "@/api/brand.api";
import { DashBrandTable } from "@/components/dash-brandTable";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ChevronLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

function IndustryRankingPage() {
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
            const data = res.data.sort((a: any, b: any) => {
                if (a.lastRank !== b.lastRank) return a.lastRank - b.lastRank;
                return b.mentions - a.mentions;
            });
            setBrands(data);
        } catch (error) {
            toast.error("Failed to load rankings.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="hover:bg-muted p-1.5 rounded-full transition-colors mr-1">
                            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                        </Link>
                        <BarChart3 className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">Industry Ranking</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl pl-4 pt-4 mb-8 rounded-2xl border ml-4 bg-white mt-3 shadow-sm">
                <DashBrandTable data={brands} loading={isLoading} />
            </div>
        </div>
    );
}

export default IndustryRankingPage;
