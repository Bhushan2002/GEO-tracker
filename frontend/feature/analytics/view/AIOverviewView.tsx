"use client";

import React from "react";
import { Zap } from "lucide-react";
import { AiOverviewStats } from "@/feature/analytics/components/Charts/AiOverviewStats";
import RealtimeBadge from "../components/Charts/RealtimeBadge";

interface AIOverviewViewProps {
    gaAccountId: string;
    aiOverviewStats: { pages: any[]; devices: any[] , countries: any[] , trend: any[] };
    loading: boolean;
}



export function AIOverviewView({
    gaAccountId,
    aiOverviewStats,
    loading,
}: AIOverviewViewProps) {
    return (
        <div className="space-y-4">
            <RealtimeBadge accountId={gaAccountId}/>
            <div className="flex items-center gap-2 mb-2">
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
    );
}
