"use client";
import { brandAPI } from "@/api/brand.api";

import { DashBrandTable } from "@/components/dash-brandTable";
import { ModelResponsesTable } from "@/components/ModelResponsesTable";
import PieChartComponent from "@/components/pieChart";
import CitationsPieChart from "@/components/CitationsPieChart";

import { VisibilityChart } from "@/components/VisibilityChart";
import Link from "next/link";
  
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Overview() {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const domainTableData = React.useMemo(() => {
    if (!brands || brands.length === 0) return [];

    const domainMap: Record<
      string,
      { count: number; citations: number; type: string }
    > = {};
    let totalLinks = 0;

    brands.forEach((brand) => {
      // Use associated_domain from new schema
      brand.associated_domain?.forEach((domainData: any) => {
        try {
          const domain = domainData.domain_citation || "";
          const urlCount = domainData.associated_url?.length || 0;

          if (!domainMap[domain]) {
            domainMap[domain] = {
              count: 0,
              citations: 0,
              type: domainData.domain_citation_type || "Other",
            };
          }

          domainMap[domain].count += 1;
          domainMap[domain].citations += urlCount;
          totalLinks++;
        } catch (e) {
          /* ignore invalid data */
        }
      });
    });

    // Convert to sorted array
    return Object.entries(domainMap)
      .map(([domain, data]) => ({
        domain,
        used: Math.round((data.count / totalLinks) * 100),
        avgCitations: (data.citations / data.count).toFixed(1),
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 6); // Show top 6
  }, [brands]);
  const chartData = React.useMemo(() => {
    return brands.slice(0, 5).map((brand) => ({
      name: brand.brand_name,
      mentions: brand.mentions || 0,
      prominence: brand.prominence_score || 0,
      timeStamp: new Date(brand.updatedAt).toLocaleDateString(),
    }));
  }, [brands]);
  
  const pieChartData = React.useMemo(() => {
    if (!brands || brands.length === 0) return [];

    const sortedBrands = [...brands].sort(
      (a, b) => (b.mentions || 0) - (a.mentions || 0)
    );

    const topBrands = sortedBrands.slice(0, 10).map((brand) => ({
      name: brand.brand_name || "Unknown",
      value: brand.mentions || 0,
    }));

    const otherMentions = sortedBrands
      .slice(5)
      .reduce((sum, brand) => sum + (brand.mentions || 0), 0);

    if (otherMentions > 0) {
      topBrands.push({
        name: "Others",
        value: otherMentions,
      });
    }

    return topBrands;
  }, [brands]);

  const citationsPieData = React.useMemo(() => {
    if (!brands || brands.length === 0) return { data: [], total: 0 };

    const CITATION_COLORS: Record<string, string> = {
      Competitor: "#EF4444",
      You: "#10B981",
      UGC: "#06B6D4",
      Editorial: "#3B82F6",
      Corporate: "#F97316",
      Reference: "#8B5CF6",
      Other: "#6B7280",
      Institutional: "#84CC16",
    };

    const typeMap: Record<string, number> = {};
    let totalCitations = 0;

    brands.forEach((brand) => {
      brand.associated_domain?.forEach((domainData: any) => {
        const type = domainData.domain_citation_type || "Other";
        const urlCount = domainData.associated_url?.length || 0;
        
        if (!typeMap[type]) {
          typeMap[type] = 0;
        }
        typeMap[type] += urlCount;
        totalCitations += urlCount;
      });
    });

    const data = Object.entries(typeMap)
      .map(([name, value]) => ({
        name,
        value,
        color: CITATION_COLORS[name] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);

    return { data, total: totalCitations };
  }, [brands]);
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getBrands();
      const data = res.data.slice(0,10).sort((a: any, b: any) => {
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
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your brand performance and AI insights
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Top Row: Visibility Chart and Brand Table */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">
                Brand Visibility Trends
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track mentions and prominence scores
              </p>
            </div>
            <div className="p-5 ">
              <VisibilityChart data={chartData} />
            </div>
          </div>

          <div className="xl:col-span-5 bg-white rounded-xl border shadow-sm overflow-hidden">
            
            <div className="p-5 border-b bg-gray-50">
              <div className="flex flex-row justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-900">
                Top Competitors
              </h3>
              <Link href={'/brand/all-brands'}>
              see all
              </Link>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Current performance leaders
              </p>
            </div>
            <div className="p-5">
              <DashBrandTable data={brands} loading={isLoading} />
            </div>
          </div>
        </div>

        {/* Middle Row: Share of Voice and Citations */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-6 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">
                Share of Voice
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Distribution of brand mentions
              </p>
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
              <h3 className="font-semibold text-lg text-gray-900">
                Sources Type
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Citations breakdown by source type
              </p>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-400">Loading...</div>
                </div>
              ) : (
                <CitationsPieChart 
                  data={citationsPieData.data} 
                  totalCitations={citationsPieData.total}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Top Sources Table */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">
                Top Sources
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Most referenced domains by AI
              </p>
            </div>
            <div className="overflow-x-auto">
              {domainTableData.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Citations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {domainTableData.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">
                              {item.domain}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.used}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {item.avgCitations}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No domain data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Model Insights */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-900">
              AI Model Responses
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Detailed insights from different AI models
            </p>
          </div>
          <div className="p-2">
            <ModelResponsesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
