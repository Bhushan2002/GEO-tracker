"use client";

import React from "react";
import { Users, Zap, TrendingUp } from "lucide-react";
import { AiOverviewStats } from "@/feature/analytics/components/Charts/AiOverviewStats";
import RealtimeBadge from "../components/Charts/RealtimeBadge";
import { Card, CardContent } from "@/components/ui/card";
import InfoButton from "@/components/InfoButton";

interface AIOverviewViewProps {
  gaAccountId: string;
  aiOverviewStats: {
    pages: any[];
    devices: any[];
    countries: any[];
    trend: any[];
    totalUsers?: number;
  };
  keymetrics: any;
  loading: boolean;
}

export function AIOverviewView({
  gaAccountId,
  aiOverviewStats,
  keymetrics,
  loading,
}: AIOverviewViewProps) {
  // Use totalUsers from API response (actual unique users metric from GA)
  const totalUsers = aiOverviewStats?.totalUsers ?? 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Overview Metrics
          </h3>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            • Real-time & historical data
          </span>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                Total AI Overview Clicks
              </h3>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">
                {(keymetrics?.aiOverviewClicks ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-600/80 mt-1">
                Visits via "AI Overview" highlights
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                Total Users
              </h3>
              <div className="flex items-center gap-2">
                {/* <InfoButton content="Total number of users from AI Overview across the selected date range based on historical analytics data." /> */}
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold ">
                {totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600/80 mt-1">
                Users from AI Overview highlights
              </p>
            </CardContent>
          </Card>
          
          <RealtimeBadge accountId={gaAccountId} />
        </div>
      </div>

      {/* Detailed Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            AI Overview Performance
          </h3>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            • Detailed AI Overview analytics
          </span>
        </div>
        
        <AiOverviewStats
          pages={aiOverviewStats.pages}
          devices={aiOverviewStats.devices}
          countries={aiOverviewStats.countries}
          trend={aiOverviewStats.trend}
          loading={loading}
        />
      </div>
    </div>
  );
}
