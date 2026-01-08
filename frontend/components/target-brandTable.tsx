"use client";

import { brandAPI } from "@/api/brand.api";
import {
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  Loader,
  ShieldCheck,
  ShieldX,
  Star,
  Activity,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BrandTableProps {
  data: any[];
  loading: boolean;
  onRefresh?: () => void;
}

export function TargetBrandTable({ data, loading, onRefresh }: BrandTableProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggleSchedule = async (id: string, isScheduled: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    try {
      if (isScheduled) {
        await brandAPI.scheduleStop(id);
        toast.success("Schedule stopped");
      } else {
        await brandAPI.scheduleRun(id);
        toast.success("Schedule started");
      }

      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error("Failed to update schedule", error);
      toast.error("Failed to update schedule");
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground/40">
        <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
        <p className="text-sm font-medium">Loading brands...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((brand, idx) => {
          return (
            <Card
              key={brand._id || idx}
              className="group relative flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedBrand(brand);
                setIsDialogOpen(true);
              }}
            >
              {/* Compact Card Header */}
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg border border-slate-100 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  <BrandLogo url={brand.official_url} name={brand.brand_name} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 truncate pr-2 leading-tight" title={brand.brand_name}>
                      {brand.brand_name}
                    </h3>
                    {brand.mainBrand && (
                      <Badge className="h-4 px-1 bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-0.5 hover:bg-amber-100 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span className="text-[8px] font-black uppercase">Main</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{brand.brand_type || "Market Entity"}</span>
                    <span className="text-slate-200">|</span>
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        brand.isScheduled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      )} />
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tight",
                        brand.isScheduled ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {brand.isScheduled ? "Live" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>

              {/* Minimal Action Footer */}
              <div className="px-5 pb-5 mt-auto flex gap-2">
                {brand.isScheduled ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSchedule(brand._id, brand.isScheduled);
                    }}
                    disabled={loadingStates[brand._id]}
                    variant="default"
                    size="sm"
                    className="flex-1 bg-[#df5555] hover:bg-[#c94a4a] text-white rounded-xl h-9 font-bold text-[11px] shadow-sm flex items-center justify-center gap-2 border-none transition-colors"
                  >
                    {loadingStates[brand._id] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : (
                      <>
                        <ShieldX className="w-3.5 h-3.5" />
                        Stop Tracking
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSchedule(brand._id, brand.isScheduled);
                    }}
                    disabled={loadingStates[brand._id]}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white rounded-xl h-9 font-bold text-[11px] shadow-sm flex items-center justify-center gap-2 border-none"
                  >
                    {loadingStates[brand._id] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Track Brand
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Brand Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Building2 className="w-32 h-32" />
            </div>

            <DialogHeader className="relative z-10 flex flex-row items-center gap-5 space-y-0 text-left">
              <div className="w-16 h-16 rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center">
                {selectedBrand && <BrandLogo url={selectedBrand.official_url} name={selectedBrand.brand_name} />}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-white m-0">
                    {selectedBrand?.brand_name}
                  </DialogTitle>
                  {selectedBrand?.mainBrand && (
                    <Badge className="bg-amber-400 text-slate-900 border-none font-black text-[10px] px-2 py-0.5">
                      PRIMARY TARGET
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-slate-400 font-medium">
                  {selectedBrand?.brand_type || "General Business Entity"}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8 bg-white">
            {/* Intel Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Digital Presence</span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 hover:border-blue-200 transition-colors group/link">
                  <div className="flex items-center gap-2 text-slate-400 group-hover/link:text-blue-500 transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Official Site</span>
                  </div>
                  <a
                    href={selectedBrand?.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-bold text-slate-900 truncate flex items-center gap-1.5"
                  >
                    {selectedBrand?.official_url?.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Monitoring Status</span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Current State</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      selectedBrand?.isScheduled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    )} />
                    <span className={cn(
                      "text-[13px] font-bold",
                      selectedBrand?.isScheduled ? "text-emerald-600" : "text-slate-500"
                    )}>
                      {selectedBrand?.isScheduled ? "Active Surveillance" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Brand Description</span>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 leading-relaxed italic text-slate-600 text-sm">
                "{selectedBrand?.brand_description || "No strategic overview provided for this tracking target."}"
              </div>
            </div>

            {/* Footer Intel */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Added On</span>
                  <span className="text-[12px] font-bold text-slate-900">
                    {selectedBrand && new Date(selectedBrand.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandLogo({ url, name }: { url: string; name: string }) {
  const [errorCount, setErrorCount] = useState(0);

  const hostname = (() => {
    try {
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      return new URL(normalizedUrl).hostname;
    } catch {
      return "";
    }
  })();

  const src =
    errorCount === 0
      ? `https://logo.clearbit.com/${hostname}`
      : errorCount === 1
        ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
        : null;

  if (!src || !hostname) {
    return (
      <span className="text-sm font-bold text-slate-400 uppercase">
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-7 h-7 object-contain"
      onError={() => setErrorCount((prev) => prev + 1)}
    />
  );
}