"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandTable } from "@/components/BrandTable";
import { brandAPI } from "@/api/brand.api";
import { TargetBrandTable } from "@/components/target-brandTable";
import { Brand } from "../../../lib/models/brand.model";
import { BadgeCheck, Building2, ChevronRight, FileText, Globe, Info, Loader, Plus, ShieldCheck, Target } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BrandPage() {
  const { targetBrands, isLoading, refreshBrands } = useDashboardData();
  const [brand_url, setBrand_url] = useState("");
  const [brand_name, setBrand_name] = useState("");
  const [actualBrandName, setActualBrandName] = useState("");
  const [brand_description, setBrand_description] = useState("");
  const [brandType, setBrandType] = useState("");
  const [mainBrand, setMainBrand] = useState(false);

  const { activeWorkspace } = useWorkspace();

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand_name.trim() || !brand_url.trim()) {
      return toast.error("Please provide both name and URL");
    }

    try {
      await brandAPI.createTargetBrand({
        brand_name,
        official_url: brand_url,
        actual_brand_name: actualBrandName.trim() || undefined,
        brand_type: brandType.trim() || undefined,
        brand_description: brand_description.trim() || undefined,
        mainBrand: mainBrand || false
      });
      toast.success("Target brand added!");
      refreshBrands();
      setBrand_name("");
      setBrand_url("");
      setActualBrandName("");
      setBrandType("");
      setBrand_description("");
      setMainBrand(false);
    } catch (error) {
      toast.error("Failed to add brand.");
    }
  };
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700 ease-out">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Brand Management</h1>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                Define and track brands to analyze AI mentions, sentiment patterns, and ranking trends.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TooltipProvider>
        <div className="max-w-[1600px] mx-auto p-8 space-y-12">
          {/* 2. Add Brand Form Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500 delay-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-slate-400" />
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 m-0">Add New Target Brand</h2>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-slate-400 hover:text-slate-600 cursor-help transition-colors">
                    <Info className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px] text-xs bg-slate-900 text-slate-50 border-slate-800">
                  Adding a brand allows our system to track its mentions across AI responses and calculate visibility scores.
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="p-8">
              <form onSubmit={handleAddBrand} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Brand Name</Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <Input
                        id="brandName"
                        placeholder="e.g. MyBrand"
                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                        value={brand_name}
                        onChange={(e) => setBrand_name(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officialUrl" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Official URL</Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <Input
                        id="officialUrl"
                        placeholder="https://example.com"
                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                        value={brand_url}
                        onChange={(e) => setBrand_url(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actualName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Legal Entity Name</Label>
                      <Input
                        id="actualName"
                        placeholder="Legal Name"
                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                        value={actualBrandName}
                        onChange={(e) => setActualBrandName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandType" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Industry / Category</Label>
                      <Input
                        id="brandType"
                        placeholder="e.g. Fintech"
                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                        value={brandType}
                        onChange={(e) => setBrandType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Quick Description</Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <Input
                        id="description"
                        placeholder="Brief overview of the brand's core business..."
                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                        value={brand_description}
                        onChange={(e) => setBrand_description(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Full Width Bottom Action */}
                <div className="md:col-span-2 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 group hover:border-slate-300 transition-all">
                      <Checkbox
                        id="main"
                        className="border-slate-400"
                        checked={mainBrand}
                        onCheckedChange={(checked: boolean | "indeterminate") => setMainBrand(checked === true)}
                      />
                      <div className="flex flex-col">
                        <Label htmlFor="main" className="text-[13px] font-bold text-slate-900 cursor-pointer">Main Tracking Brand</Label>
                        <span className="text-[10px] text-slate-500 font-medium">Use for comparative gap analysis</span>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-xl shadow-lg shadow-slate-200 flex items-center gap-2 group transition-all active:scale-95">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    Add to Tracking
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* 3. Tracking Table Section */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">Tracked Entities</h2>
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                {targetBrands.length} Total Targets
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <TargetBrandTable
                data={targetBrands}
                loading={isLoading}
                onRefresh={refreshBrands}
              />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
