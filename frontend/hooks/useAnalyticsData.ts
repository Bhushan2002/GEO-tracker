"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { api } from "@/lib/api/api";
import { useWorkspace } from "@/lib/contexts/workspace-context";

export interface KeyMetrics {
    activeUsers: number;
    engagedSessions: number;
    keyEvents: number;
    aiOverviewClicks: number;
}

export interface AiOverviewStats {
    pages: any[];
    devices: any[];
}

export default function useAnalyticsData() {
    const { activeWorkspace } = useWorkspace();

    // --- State Management ---

    // Account & Loading States
    const [gaAccounts, setGaAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

    // Date Range & View Settings
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [activeView, setActiveView] = useState<"ai-analytics" | "search-console">("ai-analytics");
    const [limit, setLimit] = useState<string>("10");

    // Analytics Data States
    const [chartData, setChartData] = useState<any[]>([]);
    const [aiModelsData, setAiModelsData] = useState<any[]>([]);
    const [firstTouchData, setFirstTouchData] = useState<any[]>([]);
    const [zeroTouchData, setZeroTouchData] = useState<any[]>([]);
    const [aiLandingPageData, setAiLandingPageData] = useState<any[]>([]);
    const [keyMetrics, setKeyMetrics] = useState<KeyMetrics>({
        activeUsers: 0,
        engagedSessions: 0,
        keyEvents: 0,
        aiOverviewClicks: 0,
    });
    const [aiOverviewStats, setAiOverviewStats] = useState<AiOverviewStats>({ pages: [], devices: [] });
    const [conversionRateData, setConversionRateData] = useState<any[]>([]);
    const [topicClusterData, setTopicClusterData] = useState<any[]>([]);
    const [aiGrowthData, setAiGrowthData] = useState<any[]>([]);
    const [aiDeviceData, setAiDeviceData] = useState<any[]>([]);
    const [demographicsData, setDemographicsData] = useState<any[]>([]);

    // Property Management
    const [propertiesMap, setPropertiesMap] = useState<Record<string, any[]>>({});
    const [loadingProperties, setLoadingProperties] = useState<Record<string, boolean>>({});

    // Search Console State
    const [gscAccount, setGscAccount] = useState<any>(null);
    const [searchConsoleData, setSearchConsoleData] = useState<any>(null);
    const [scLoading, setScLoading] = useState(false);
    const [scSites, setScSites] = useState<any[]>([]);
    const [scChartData, setScChartData] = useState<any[]>([]);
    const [scTopQueries, setScTopQueries] = useState<any[]>([]);
    const [scLimit, setScLimit] = useState<string>("50");
    const [gscProperties, setGscProperties] = useState<any[]>([]);
    const [loadingGscProperties, setLoadingGscProperties] = useState(false);

    // GTM & Setup States
    const [isGtmDialogOpen, setIsGtmDialogOpen] = useState(false);
    const [gtmContainers, setGtmContainers] = useState<any[]>([]);
    const [selectedGtmContainer, setSelectedGtmContainer] = useState<string>("");
    const [installationGtmId, setInstallationGtmId] = useState("");

    // Settings / UI States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activeSetupAccount, setActiveSetupAccount] = useState<any>(null);
    const [showInstallInstructions, setShowInstallInstructions] = useState(false);


    // --- Actions & Logical Functions ---

    // 1. Load GA Accounts
    const loadGAAccounts = useCallback(async () => {
        if (!activeWorkspace?._id) {
            setGaAccounts([]);
            setInitialLoading(false);
            return;
        }

        try {
            const response = await api.get("/api/ga-accounts");
            setGaAccounts(response.data);

            if (response.data.length > 0) {
                setSelectedAccountId((prev) => {
                    if (!prev) return response.data[0]._id;
                    const exists = response.data.find((a: any) => a._id === prev);
                    return exists ? prev : response.data[0]._id;
                });
            }
        } catch (error: any) {
            console.error("Failed to load GA accounts:", error);
            toast.error(error.response?.data?.message || "Failed to load accounts");
            setGaAccounts([]);
        } finally {
            setInitialLoading(false);
        }
    }, [activeWorkspace?._id]);

    // 2. Load GSC Account
    const loadGscAccount = useCallback(async () => {
        if (!activeWorkspace?._id) return;

        try {
            const response = await api.get("/api/search-console-accounts");
            setGscAccount(response.data);
        } catch (error) {
            console.error("Failed to load GSC account:", error);
            setGscAccount(null);
        }
    }, [activeWorkspace?._id]);

    // 3. Load All Analytics Data for Account
    const loadAccountData = useCallback(async (accountId: string) => {
        if (!accountId || isQuotaExceeded) return;

        setLoading(true);

        const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "30daysAgo";
        const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "today";
        const dateParams = `&startDate=${startDate}&endDate=${endDate}`;

        try {
            const results = await Promise.allSettled([
                api.get(`/api/analytics-by-account?accountId=${accountId}${dateParams}`),
                api.get(`/api/ai-models-by-account?accountId=${accountId}${dateParams}`),
                api.get(`/api/analytics/ai-overview-stats?accountId=${accountId}${dateParams}`),
                api.get(`/api/analytics/first-touch?accountId=${accountId}`),
                api.get(`/api/analytics/zero-touch?accountId=${accountId}${dateParams}`),
                api.get(`/api/analytics/ai-landing-pages?accountId=${accountId}${dateParams}&limit=${limit}`),
                api.get(`/api/analytics/ai-conversions?accountId=${accountId}${dateParams}`),
                api.get(`/api/analytics/ai-growth-mom?accountId=${accountId}`),
                api.get(`/api/analytics/ai-device-split?accountId=${accountId}${dateParams}`),
                api.get(`/api/analytics/demographics?accountId=${accountId}${dateParams}`),
                api.get(`/api/analytics/topic-clusters?accountId=${accountId}${dateParams}`),
            ]);

            // Helper to safely extract data from settled promise
            const getData = (index: number) => {
                const result = results[index];
                return result.status === "fulfilled" ? result.value.data : null;
            };

            const analyticsData = getData(0);
            const aiModels = getData(1);
            const aiStats = getData(2);
            const fTouch = getData(3);
            const zTouch = getData(4);
            const landingPages = getData(5);
            const conversions = getData(6);
            const growth = getData(7);
            const devices = getData(8);
            const demographics = getData(9);
            const topics = getData(10);

            // Update States
            setChartData(analyticsData?.chartData || []);
            setKeyMetrics(analyticsData?.metrics || {
                activeUsers: 0,
                engagedSessions: 0,
                keyEvents: 0,
                aiOverviewClicks: 0
            });

            // Format AI Models
            const allowedModels = ["ChatGPT", "Copilot", "Perplexity", "Gemini", "Claude"];
            const formattedAIModels = allowedModels.map((modelName) => {
                const existingData = aiModels?.find((item: any) => item.model === modelName);
                if (existingData) return existingData;
                return { model: modelName, users: 0, sessions: 0, conversionRate: "0%" };
            });
            setAiModelsData(formattedAIModels);

            setAiOverviewStats(aiStats || { pages: [], devices: [] });
            setFirstTouchData(fTouch || []);
            setZeroTouchData(zTouch || []);
            setAiLandingPageData(landingPages?.landingPageData || []);
            setConversionRateData(conversions || []);
            setAiGrowthData(growth || []);
            setAiDeviceData(devices || []);
            setDemographicsData(demographics || []);
            setTopicClusterData(topics || []);

            setIsQuotaExceeded(false);

        } catch (error: any) {
            console.error("Failed to load account data:", error);
            const isQuotaError = error.response?.status === 429 || error.message?.includes("quota");
            if (isQuotaError) {
                setIsQuotaExceeded(true);
                toast.error("Analytics quota exceeded. Refreshing shortly.");
            } else {
                toast.error("Failed to fetch analytics data");
            }
        } finally {
            setLoading(false);
        }
    }, [dateRange, limit, isQuotaExceeded]);


    // 4. Load Landing Pages Only (for limit change)
    const loadLandingPagesOnly = useCallback(async (accountId: string) => {
        if (!accountId) return;
        try {
            const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "30daysAgo";
            const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "today";
            const dateParams = `&startDate=${startDate}&endDate=${endDate}`;

            const res = await api.get(`/api/analytics/ai-landing-pages?accountId=${accountId}${dateParams}&limit=${limit}`);
            setAiLandingPageData(res.data?.landingPageData || []);
        } catch (error) {
            console.error("Failed to reload landing pages:", error);
        }
    }, [dateRange, limit]);

    // 5. Load Search Console Data
    const loadSearchConsoleData = useCallback(async (accountId: string) => {
        setScLoading(true);
        const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "30daysAgo";
        const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "today";
        const dateParams = `&startDate=${startDate}&endDate=${endDate}`;

        try {
            const [chartResponse, queriesResponse] = await Promise.all([
                api.get(`/api/search-console/queries?accountId=${accountId}${dateParams}`),
                api.get(`/api/search-console/top-queries?accountId=${accountId}&limit=${scLimit}${dateParams}`),
            ]);

            setScChartData(chartResponse.data.chartData || []);
            setSearchConsoleData({ totals: chartResponse.data.totals });
            setScTopQueries(queriesResponse.data.queries || []);
        } catch (error: any) {
            console.error("Search Console data error:", error);
        } finally {
            setScLoading(false);
        }
    }, [dateRange, scLimit]);

    // 6. Properties Logic
    const fetchPropertiesForAccount = useCallback(async (accountId: string) => {
        if (propertiesMap[accountId]) return;
        setLoadingProperties((prev) => ({ ...prev, [accountId]: true }));
        try {
            const res = await api.get(`/api/ga-accounts/${accountId}/properties`);
            setPropertiesMap((prev) => ({ ...prev, [accountId]: res.data }));
        } catch (error) {
            console.error("Failed to fetch properties", error);
        } finally {
            setLoadingProperties((prev) => ({ ...prev, [accountId]: false }));
        }
    }, [propertiesMap]);


    // --- Effects ---

    // Initial Load & Workspace Change
    useEffect(() => {
        if (activeWorkspace?._id) {
            // Reset Data
            setGaAccounts([]);
            setSelectedAccountId("");
            setChartData([]);
            setKeyMetrics({ activeUsers: 0, engagedSessions: 0, keyEvents: 0, aiOverviewClicks: 0 });
            setSearchConsoleData(null);
            setIsQuotaExceeded(false);

            setInitialLoading(true);
            loadGAAccounts();
            loadGscAccount();
        }
    }, [activeWorkspace?._id, loadGAAccounts, loadGscAccount]);

    // Trigger Account Data Load
    useEffect(() => {
        if (selectedAccountId && dateRange?.from && dateRange?.to) {
            loadAccountData(selectedAccountId);
        }
    }, [selectedAccountId, dateRange, loadAccountData]);

    // Trigger Search Console Load
    useEffect(() => {
        if (gscAccount?._id && gscAccount?.siteUrl && !isQuotaExceeded) {
            loadSearchConsoleData(gscAccount._id);
        }
    }, [gscAccount, scLimit, isQuotaExceeded, dateRange, loadSearchConsoleData]);

    // Trigger Landing Page Reload on Limit Change (Debounced)
    useEffect(() => {
        if (!selectedAccountId || initialLoading) return;
        const timer = setTimeout(() => {
            loadLandingPagesOnly(selectedAccountId);
        }, 300);
        return () => clearTimeout(timer);
    }, [limit, selectedAccountId, loadLandingPagesOnly, initialLoading]);


    return {
        // State
        gaAccounts,
        selectedAccountId,
        loading,
        initialLoading,
        isQuotaExceeded,
        chartData,
        aiModelsData,
        firstTouchData,
        zeroTouchData,
        aiLandingPageData,
        keyMetrics,
        aiOverviewStats,
        conversionRateData,
        topicClusterData,
        aiGrowthData,
        aiDeviceData,
        demographicsData,
        propertiesMap,
        loadingProperties,
        activeView,
        dateRange,
        limit,

        // Search Console State
        gscAccount,
        searchConsoleData,
        scLoading,
        scSites,
        scChartData,
        scTopQueries,
        scLimit,

        // GTM State
        isGtmDialogOpen,
        gtmContainers,
        selectedGtmContainer,
        installationGtmId,

        // Actions
        setGaAccounts,
        setSelectedAccountId,
        setDateRange,
        setActiveView,
        setLimit,
        setScLimit,
        loadGAAccounts,
        loadGscAccount,
        loadAccountData,
        loadSearchConsoleData,
        fetchPropertiesForAccount,
        setGscAccount,
        setSearchConsoleData,
        setScChartData,
        setScTopQueries,
        setScSites,
        setGscProperties,

        // GTM Actions
        setIsGtmDialogOpen,
        setGtmContainers,
        setSelectedGtmContainer,
        setInstallationGtmId,

        // UI Helpers
        isSettingsOpen, setIsSettingsOpen,
        exporting, setExporting,
        activeSetupAccount, setActiveSetupAccount,
        showInstallInstructions, setShowInstallInstructions
    };
}