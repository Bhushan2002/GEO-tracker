"use client";
import { brandAPI } from "@/api/brand.api";

import { DashBrandTable } from "@/components/dash-brandTable";
import DomainTable from "@/components/domain-table";
import { ModelResponsesTable } from "@/components/ModelResponsesTable";
import PieChartComponent from "@/components/pieChart";

import { VisibilityChart } from "@/components/VisibilityChart";
import { Separator } from "@radix-ui/react-separator";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const data = [
  { name: "ChatGPT", value: 40 },
  { name: "Claude", value: 25 },
  { name: "Gemini", value: 20 },
  { name: "Others", value: 15 },
];

export default function Overview() {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pieData = brands.map((brand) => ({
    name: brand.brand_name,
    value: brand.mentions,
  }));
  const chartData = brands.map((brand) => ({
    name: brand.brand_name,
    prominence: brand.prominence_score || 0,
    mentions: brand.mentions || 0,
  }));
  const pieChartData = React.useMemo(() => {
    if (!brands || brands.length === 0) return [];

    return [...brands]
      .sort((a, b) => (b.mentions || 0) - (a.mentions || 0))
      .slice(0, 5)
      .map((brand) => ({
        name: brand.brand_name || "Unknown",
        value: brand.mentions || 0,
      }));
  }, [brands]);

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
    <div>
      <div className="flex flex-col">
        <div className=" flex flex-row ">
          {/* chart */}
          <div className="h-100 w-150 ">
            <VisibilityChart data={chartData} />
          </div>
          {/* brand table */}
          <div className="ml-3 pt-3  rounded-xl border bg-white shadow">
            <span className="font-medium text-gray-800  ml-5 mt-2">Brand</span>
            <Separator className="my-5" />
            <hr />
            <DashBrandTable data={brands} loading={isLoading} />
          </div>
        </div>

        <div className=" flex flex-row mt-4 space-x-4">
          {/* pie chart */}
          <div className="bg-white border rounded-2xl pt-4 w-150 h-100">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                Loading Chart...
              </div>
            ) : pieChartData.length > 0 ? (
              <PieChartComponent data={pieChartData} />
            ) : (
              <div className="flex items-center justify-center h-full">
                No Brand Data Available
              </div>
            )}
          </div>
          {/* domain tables */}
          <div className=" ">
            <DomainTable />
          </div>
        </div>

        <div className="h-100 w-310 pt-7">
          <ModelResponsesTable />
        </div>
      </div>
    </div>
  );
}
