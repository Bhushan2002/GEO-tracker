"use client";

import { brandAPI } from "@/api/brand.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardHeader } from "./ui/card";

interface BrandTableProps {
  data: any[];
  loading: boolean;
  onRefresh?: () => void;
}

export function TargetBrandTable({ data, loading, onRefresh }: BrandTableProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

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
    <div>
      <div className="min-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {data.map(brand => (
          <Card key={brand._id} className="flex flex-col  min-w-full hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-lg text-gray-900 ">{brand.brand_name}</h3>
            </CardHeader>

            <div className="flex-1 px-6 py-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Official URL</p>
                <a
                  className="text-sm text-blue-600 hover:underline break-all line-clamp-2"
                  href={brand.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={brand.official_url}
                >
                  {brand.official_url}
                </a>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Added On</p>
                <p className="text-sm text-gray-700">
                  {new Date(brand.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${brand.isScheduled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {brand.isScheduled ? "Tracking" : "Not Tracked"}
                </span>
              </div>
              {brand.mainBrand ?
                <span className="text-gray-800 font-bold">Main Brand</span> : <span></span>}
            </div>

            <div className="flex gap-2 p-4 pt-3 border-t bg-gray-50">
              <Button
                onClick={() => handleToggleSchedule(brand._id, brand.isScheduled)}
                disabled={loadingStates[brand._id] || brand.isScheduled}
                variant={brand.isScheduled ? "outline" : "default"}
                size="sm"
                className="flex-1"
              >
                {loadingStates[brand._id] ? "" : "Track"}
              </Button>
              <Button
                onClick={() => handleToggleSchedule(brand._id, brand.isScheduled)}
                disabled={loadingStates[brand._id] || !brand.isScheduled}
                variant={!brand.isScheduled ? "outline" : "destructive"}
                size="sm"
                className="flex-1"
              >
                {loadingStates[brand._id] ? "" : "Reject"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

    </div>

  );
}