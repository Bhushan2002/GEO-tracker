"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import { BrandTable } from "@/feature/brand/components/BrandTable";
import { brandAPI } from "@/lib/api/brand.api";
import { TargetBrandGrid } from "@/feature/brand/components/TargetBrandGrid";
import { AddTargetBrandForm } from "@/feature/brand/view/AddTargetBrandForm";
import { Brand } from "../../../lib/models/brand.model";
import {
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { DashBrandTable } from "@/feature/brand/components/DashboardBrandTable";

/**
 * Brand management page for adding and tracking target brands.
 * Allows users to define brands, URLs, and metadata for AI tracking.
 */
export default function BrandPage() {
  const { targetBrands, isLoading, refreshBrands } = useDashboardData();
  const { allBrands, refreshAllBrands, isLoading: isAllBrandsLoading } = useDashboardData();
  const [isSyncingColors, setIsSyncingColors] = useState(false);

  const { activeWorkspace } = useWorkspace();

  const handleSyncColors = async () => {
    setIsSyncingColors(true);
    try {
      const response = await fetch('/api/brands/sync-colors');
      const data = await response.json();
      toast.success(`Colors synced! Updated ${data.updated} brands.`);
      refreshAllBrands();
    } catch (error) {
      toast.error("Failed to sync colors.");
    } finally {
      setIsSyncingColors(false);
    }
  };

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700 ease-out">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                Brand Management
              </h1>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                Define and track brands to analyze AI mentions, sentiment
                patterns, and ranking trends.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TooltipProvider>
        <div className="max-w-[1600px] mx-auto p-8 space-y-12">
          {/* 2. Add Brand Form Section */}
          <AddTargetBrandForm onSuccess={refreshBrands} />

          {/* 3. Tracking Table Section */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">
                  Tracked Entities{" "}
                  <span className="text-xs font-medium text-slate-400 ml-2 font-normal">
                    • Click card for full details
                  </span>
                </h2>
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                {targetBrands.length} Total Targets
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <TargetBrandGrid
                data={targetBrands}
                loading={isLoading}
                onRefresh={refreshBrands}
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 mt-8">
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Discovered Brands{" "}
                  </h2>
                </div>
                <div className="flex items-center gap-3">

                  <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                    {allBrands.length} Total Targets
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                <DashBrandTable data={allBrands} loading={isAllBrandsLoading} />
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
