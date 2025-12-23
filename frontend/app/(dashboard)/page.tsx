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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your brand performance and AI insights</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Top Row: Visibility Chart and Brand Table */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">Brand Visibility Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Track mentions and prominence scores</p>
            </div>
            <div className="p-5 ">
              <VisibilityChart data={chartData} />
            </div>
          </div>
          
          <div className="xl:col-span-5 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">Top Brands Ranking</h3>
              <p className="text-sm text-gray-500 mt-1">Current performance leaders</p>
            </div>
            <div className="p-5">
              <DashBrandTable data={brands} loading={isLoading} />
            </div>
          </div>
        </div>

        {/* Middle Row: Share of Voice */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-6 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">Share of Voice</h3>
              <p className="text-sm text-gray-500 mt-1">Distribution of brand mentions</p>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-400">Loading...</div>
                </div>
              ) : (
                <PieChartComponent data={pieChartData} />
              )}
            </div>
          </div>

          <div className="xl:col-span-6 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">Domain Authority</h3>
              <p className="text-sm text-gray-500 mt-1">Top domains referenced by AI</p>
            </div>
            <div className="p-5">
              {domainChartData.length > 0 ? (
                <DomainAnalysisChart data={domainChartData}/>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No domain data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Model Insights */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-900">AI Model Responses</h3>
            <p className="text-sm text-gray-500 mt-1">Detailed insights from different AI models</p>
          </div>
          <div className="p-2">
            <ModelResponsesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
