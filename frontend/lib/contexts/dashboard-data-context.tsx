
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Prompt, ModelResponse } from "@/types";
import { PromptAPI } from "@/lib/api/prompt.api";
import { brandAPI } from "@/lib/api/brand.api";
import { ModelResponseAPI } from "@/lib/api/modelresponse.api";
import { useWorkspace } from "./workspace-context";
import { api } from "../api/api";


// --- Types ---

interface DashboardDataContextType {
    prompts: Prompt[];
    targetBrands: any[];
    modelResponses: ModelResponse[];
    allBrands: any[];
    brandHistory: any[];
    modelsAnalytics: any[];

    // Status flags
    isLoading: boolean;

    // Refresh actions
    refreshAll: () => Promise<void>;
    refreshPrompts: () => Promise<void>;
    refreshBrands: () => Promise<void>;
    refreshResponses: () => Promise<void>;
    refreshAllBrands: () => Promise<void>;
    refreshBrandHistory: () => Promise<void>;
    refreshModelsAnalytics: () => Promise<void>;

    // Analytics prefetch (for background loading)
    prefetchAnalytics: () => Promise<void>;
    analyticsCache: any;
}


// --- Context Definition ---

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

/**
 * Global provider for all Dashboard-related data.
 * Centralizes data fetching to avoid redundant API calls across widgets.
 * Automatically refreshes data when the active workspace changes.
 */
export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
    const { activeWorkspace } = useWorkspace();

    // --- State ---

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [targetBrands, setTargetBrands] = useState<any[]>([]);
    const [modelResponses, setModelResponses] = useState<ModelResponse[]>([]);
    const [allBrands, setAllBrands] = useState<any[]>([]);
    const [brandHistory, setBrandHistory] = useState<any[]>([]);
    const [modelsAnalytics, setModelsAnalytics] = useState<any[]>([]);

    // Loading state management
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Analytics cache for prefetching
    const [analyticsCache, setAnalyticsCache] = useState<any>(null);


    // --- Fetch Actions ---

    const fetchPrompts = useCallback(async () => {
        try {
            const res = await PromptAPI.getAll();
            setPrompts(res.data);
        } catch (error) {
            console.error("Failed to load prompts", error);
        }
    }, []);

    const fetchBrands = useCallback(async () => {
        try {
            const res = await brandAPI.getTargetBrand();
            setTargetBrands(res.data);
        } catch (error) {
            console.error("Failed to load brands", error);
        }
    }, []);

    const fetchResponses = useCallback(async () => {
        try {
            const res = await ModelResponseAPI.getModelResponses();
            setModelResponses(res.data);
        } catch (error) {
            console.error("Failed to load model responses", error);
        }
    }, []);

    const fetchAllBrands = useCallback(async () => {
        try {
            const res = await brandAPI.getBrands();
            setAllBrands(res.data);
        } catch (error) {
            console.error("Failed to load all brands", error);
        }
    }, []);

    const fetchBrandHistory = useCallback(async () => {
        try {
            const res = await brandAPI.getBrandHistory(30);
            setBrandHistory(res.data);
        } catch (error) {
            console.error("Failed to load brand history", error);
        }
    }, []);

    const fetchModelsAnalytics = useCallback(async () => {
        try {
            const res = await api.get("/api/models-analytics");
            setModelsAnalytics(res.data);
        } catch (error) {
            console.error("Failed to load models analytics", error);
        }
    }, []);

    // Prefetch analytics data in background
    const prefetchAnalytics = useCallback(async () => {
        if (!activeWorkspace?._id) return;

        try {
            console.log('🚀 Prefetching analytics data in background...');
            // Fetch GA accounts list
            const gaRes = await api.get('/api/ga-accounts');

            // If user has GA accounts, prefetch the first one's data
            if (gaRes.data && gaRes.data.length > 0) {
                const accountId = gaRes.data[0]._id;

                // Prefetch all analytics data in parallel
                const [analyticsRes, modelsRes, landingRes] = await Promise.all([
                    api.get(`/api/analytics-by-account?accountId=${accountId}`),
                    api.get(`/api/ai-models-by-account?accountId=${accountId}`),
                    api.get(`/api/analytics/ai-landing-pages?accountId=${accountId}`),
                ]);

                // Cache the results
                setAnalyticsCache({
                    accountId,
                    gaAccounts: gaRes.data,
                    keyMetrics: analyticsRes.data?.metrics || {
                        activeUsers: 0,
                        engagedSessions: 0,
                        keyEvents: 0,
                        aiOverviewClicks: 0,
                    },
                    chartData: analyticsRes.data?.chartData || [],
                    aiModelsData: modelsRes.data || [],
                    aiLandingPageData: landingRes.data?.landingPageData || [],
                    cachedAt: new Date().toISOString(),
                });

                console.log('✅ Analytics data prefetched successfully!');
            }
        } catch (error) {
            console.log('⚠️ Analytics prefetch failed (non-critical):', error);
            // Silent fail - prefetching is optional
        }
    }, [activeWorkspace?._id]);


    // --- Aggregated Actions ---
    /**
     * Refreshes all dashboard data in parallel.
     * Sets global loading state during the process.
     */
    const refreshAll = useCallback(async () => {
        setIsLoading(true);
        // Clear existing data to avoid stale UI state while fetching new workspace data
        setPrompts([]);
        setTargetBrands([]);
        setModelResponses([]);
        setAllBrands([]);
        setBrandHistory([]);
        setModelsAnalytics([]);

        try {
            await Promise.all([
                fetchPrompts(),
                fetchBrands(),
                fetchResponses(),
                fetchAllBrands(),
                fetchBrandHistory(),
                fetchModelsAnalytics(),
            ]);
        } catch (error) {
            console.error("Error refreshing dashboard data:", error);
        } finally {
            setIsLoading(false);
            setHasLoaded(true);
        }
    }, [fetchPrompts, fetchBrands, fetchResponses, fetchAllBrands, fetchBrandHistory, fetchModelsAnalytics]);

    // Prefetch analytics in background after initial data load
    useEffect(() => {
        if (hasLoaded && activeWorkspace?._id) {
            // Wait a bit to let main dashboard load first
            const timer = setTimeout(() => {
                prefetchAnalytics();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [hasLoaded, activeWorkspace?._id, prefetchAnalytics]);


    // --- Effects ---

    // Trigger data refresh whenever the workspace context changes
    useEffect(() => {
        if (activeWorkspace?._id) {
            // Reset loading tracking flags for a fresh start in the new workspace
            setHasLoaded(false);
            refreshAll();
        }
    }, [activeWorkspace?._id, refreshAll]);

    return (
        <DashboardDataContext.Provider
            value={{
                prompts,
                targetBrands,
                modelResponses,
                allBrands,
                brandHistory,
                modelsAnalytics,
                isLoading: isLoading || !hasLoaded,
                refreshAll,
                refreshPrompts: fetchPrompts,
                refreshBrands: fetchBrands,
                refreshResponses: fetchResponses,
                refreshAllBrands: fetchAllBrands,
                refreshBrandHistory: fetchBrandHistory,
                refreshModelsAnalytics: fetchModelsAnalytics,
                prefetchAnalytics,
                analyticsCache,
            }}
        >
            {children}
        </DashboardDataContext.Provider>
    );
}

/**
 * Hook to access Dashboard data.
 * Only works within the DashboardDataProvider.
 */
export function useDashboardData() {
    const context = useContext(DashboardDataContext);
    if (context === undefined) {
        throw new Error("useDashboardData must be used within a DashboardDataProvider");
    }
    return context;
}
