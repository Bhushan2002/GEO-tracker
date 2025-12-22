"use client";
import { brandAPI } from "@/api/brand.api";

import { DashBrandTable } from "@/components/dash-brandTable";
import DomainAnalysisChart from "@/components/domain-chart";
import DomainTable from "@/components/domain-chart";
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

  const domainChartData = React.useMemo(() => {
  if (!brands || brands.length === 0) return [];

  const domainMap: Record<string, number> = {};
  let totalLinks = 0;

  brands.forEach((brand) => {
    brand.associated_links?.forEach((link: any) => {
      try {
        // Extract domain from URL
        const domain = new URL(link.url.startsWith("http") ? link.url : `https://${link.url}`)
          .hostname.replace("www.", "");
        domainMap[domain] = (domainMap[domain] || 0) + 1;
        totalLinks++;
      } catch (e) { /* ignore invalid urls */ }
    });
  });

  // Convert to sorted array and calculate percentages
  return Object.entries(domainMap)
    .map(([domain, count]) => ({
      domain,
      used: Math.round((count / totalLinks) * 100)
    }))
    .sort((a, b) => b.used - a.used)
    .slice(0, 5); // Show top 5
}, [brands]);
const chartData = React.useMemo(() => {
  return brands.slice(0, 6).map((brand) => ({
    name: brand.brand_name,
    mentions: brand.mentions || 0,
    prominence: brand.prominence_score || 0,
  }));
}, [brands]);
  const pieChartData = React.useMemo(() => {
  if (!brands || brands.length === 0) return [];


  const sortedBrands = [...brands].sort((a, b) => (b.mentions || 0) - (a.mentions || 0));


  const topBrands = sortedBrands.slice(0, 10).map((brand) => ({
    name: brand.brand_name || "Unknown",
    value: brand.mentions || 0,
  }));

  const otherMentions = sortedBrands.slice(5).reduce((sum, brand) => sum + (brand.mentions || 0), 0);

  if (otherMentions > 0) {
    topBrands.push({
      name: "Others",
      value: otherMentions,
    });
  }

  return topBrands;
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
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Top Row: Visibility Chart and Brand Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-xl border shadow-sm h-full">
          <VisibilityChart data={chartData} />
        </div>
        <div className="lg:col-span-5 bg-white rounded-xl border shadow-sm p-5 h-full">
          <h3 className="font-semibold text-lg mb-4">Top Brands Ranking</h3>
          <DashBrandTable data={brands} loading={isLoading} />
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-xl border shadow-sm p-5 min-h-[480px]">
          <h3 className="font-semibold text-lg mb-2">Share of Voice</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading...</div>
          ) : (
            <PieChartComponent data={pieChartData} />
          )}
        </div>
        {/* <div className="lg:col-span-7 bg-white rounded-xl border shadow-sm p-5 min-h-[400px]">
          <h3 className="font-semibold text-lg mb-4">Domain Authority</h3>
          <DomainAnalysisChart data={domainChartData}/>
        </div> */}
      </div>


      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="font-semibold text-lg mb-4">Detailed Model Insights</h3>
        <ModelResponsesTable />
      </div>
    </div>
  );
}
