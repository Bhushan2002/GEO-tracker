"use client";
import { brandAPI } from "@/api/brand.api";
import { DashBrandTable } from "@/components/dash-brandTable";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

function AllBrands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getBrands();
      const data = res.data.sort((a: any, b: any) => {
        if (a.lastRank !== b.lastRank) return a.lastRank - b.lastRank;
        return b.mentions - a.mentions;
      });
      setBrands(data);
    } catch (error) {
      toast.error("Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">All Brands</h1>
        </div>
      </div>
      <div className="max-w-4xl pl-4 pt-4 mb-8 rounded-2xl  border ml-4 bg-white mt-3">
        <DashBrandTable data={brands} loading={isLoading} />
      </div>
    </div>
  );
}

export default AllBrands;
