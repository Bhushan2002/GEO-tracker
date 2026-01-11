"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/api";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Loader2,
  Settings,
  Plus,
  Zap,
  Trash2,
  Users,
  MousePointerClick,
  Loader,
  ChartBar,
  Globe,
  Layout,
  Smartphone,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  Tooltip as InfoTooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { AIConversionRateChart } from "@/components/Charts/AIConversionRateChart";
import { TopicClustersTreemap } from "@/components/Charts/TopicClusterTree";
import { AIGrowthRateChart } from "@/components/Charts/AIGrowthRateChart";
import { AIDeviceBreakdownChart } from "@/components/Charts/AIDeviceBreakdownChart";
import { cn } from "@/lib/utils";
import { AiDemographicsChart } from "@/components/Charts/AiDemographicsChart";
import FirstZeroTouchChart from "@/components/Charts/FirstZeroTouchChart";
import CitationsPieChart from "@/components/Charts/CitationsPieChart";

/**
 * Analytics page integrating Google Analytics data.
 * Visualizes user engagement, AI model traffic, and conversion metrics.
 */
export default function GoogleAnalyticsPage() {
  const { activeWorkspace } = useWorkspace();
  const [gaAccounts, setGaAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [aiModelsData, setAiModelsData] = useState<any[]>([]);
  const [firstTouchData, setFirstTouchData] = useState<any[]>([]);
  const [zeroTouchData, setZeroTouchData] = useState<any[]>([]);
  const [aiLandingPageData, setAiLandingPageData] = useState<any[]>([]);
  const [keyMetrics, setKeyMetrics] = useState({
    activeUsers: 0,
    engagedSessions: 0,
    keyEvents: 0,
    aiOverviewClicks: 0,
  });
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // property selection state
  const [propertiesMap, setPropertiesMap] = useState<Record<string, any[]>>({});
  const [loadingProperties, setLoadingProperties] = useState<Record<string, boolean>>({})

  const [conversionRateData, setConversionRateData] = useState<any[]>([]);
  const [topicClusterData, setTopicClusterData] = useState<any[]>([]);
  const [aiGrowthData, setAiGrowthData] = useState<any[]>([]);
  const [aiDeviceData, setAiDeviceData] = useState<any[]>([]);
  const [demographicsData, setDemographicsData] = useState<any[]>([]);
  const [missingAudience, setMissingAudience] = useState(false);

  useEffect(() => {
    if (activeWorkspace?._id) {
      // Reset local state to ensure clean transition before loading new data
      setGaAccounts([]);
      setSelectedAccountId("");
      setChartData([]);
      setAiModelsData([]);
      setFirstTouchData([]);
      setZeroTouchData([]);
      setAiLandingPageData([]);
      setConversionRateData([]);
      setAiGrowthData([]);
      setAiDeviceData([]);
      setTopicClusterData([]);
      setDemographicsData([]);
      setKeyMetrics({
        activeUsers: 0,
        engagedSessions: 0,
        keyEvents: 0,
        aiOverviewClicks: 0,
      });
      setIsQuotaExceeded(false);

      setInitialLoading(true);
      loadGAAccounts();
    }
  }, [activeWorkspace?._id]);

  useEffect(() => {
    if (selectedAccountId) {
      sessionStorage.setItem("ga-last-account-id", selectedAccountId);
      loadAccountData(selectedAccountId);
    }
  }, [selectedAccountId]);

  const loadGAAccounts = async () => {
    if (!activeWorkspace?._id) return;

    try {
      const CACHE_KEY = `ga-accounts-cache-${activeWorkspace._id}`;
      const cached = sessionStorage.getItem(CACHE_KEY);

      if (cached) {
        const parsed = JSON.parse(cached);
        setGaAccounts(parsed);
        if (parsed.length > 0 && !selectedAccountId) {
          // Try to restore last selected account
          const lastId = sessionStorage.getItem("ga-last-account-id");
          if (lastId && parsed.find((a: any) => a._id === lastId)) {
            setSelectedAccountId(lastId);
          } else {
            setSelectedAccountId(parsed[0]._id);
          }
        }
        setInitialLoading(false);
        return;
      }

      const response = await api.get("/api/ga-accounts");
      setGaAccounts(response.data);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(response.data));

      if (response.data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(response.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to load GA accounts:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadAccountData = async (accountId: string) => {

    if (!accountId || isQuotaExceeded) {

      return;
    }

    setLoading(true);
    setMissingAudience(false); // Reset the warning

    // Check cache first
    const cacheKey = `ga-account-data-${accountId}`;
    const cachedData = sessionStorage.getItem(cacheKey);


    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (effectively session-only)


        if (cacheAge < CACHE_DURATION) {
          // Use cached data
          setChartData(parsed.chartData || []);
          setKeyMetrics(
            parsed.keyMetrics || {
              activeUsers: 0,
              engagedSessions: 0,
              keyEvents: 0,
            }
          );
          setAiModelsData(parsed.aiModelsData || []);
          setFirstTouchData(parsed.firstTouchData || []);
          setZeroTouchData(parsed.zeroTouchData || []);
          setAiLandingPageData(parsed.aiLandingPageData || []);
          setConversionRateData(parsed.conversionRateData || []);
          setAiGrowthData(parsed.aiGrowthData || []);
          setAiDeviceData(parsed.aiDeviceData || []);
          setTopicClusterData(parsed.topicClusterData || []);
          setDemographicsData(parsed.demographicsData || []);
          setLoading(false);

          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached data:", e);
      }
    }

    try {
      // Fetch main analytics (traffic & metrics)
      const analyticsRes = await api.get(
        `/api/analytics-by-account?accountId=${accountId}`
      );
      const mainData = analyticsRes.data.chartData || [];
      const metrics = analyticsRes.data.metrics || {
        activeUsers: 0,
        engagedSessions: 0,
        keyEvents: 0,
      };

      // Fetch AI models traffic
      const aiModelsRes = await api.get(
        `/api/ai-models-by-account?accountId=${accountId}`
      );

      // Ensure specific models are included, even if they have 0 data
      const allowedModels = [
        "ChatGPT",
        "Copilot",
        "Perplexity",
        "Gemini",
        "Claude",
      ];
      const formattedAIModels = allowedModels.map((modelName) => {
        const existingData = aiModelsRes.data.find(
          (item: any) => item.model === modelName
        );
        if (existingData) return existingData;
        return {
          model: modelName,
          users: 0,
          sessions: 0,
          conversionRate: "0%",
        };
      });

      // Fetch First Touch, Zero Touch & AI Landing Pages data in parallel

      const results = await Promise.allSettled([
        api.get(`/api/analytics/first-touch?accountId=${accountId}`),
        api.get(`/api/analytics/zero-touch?accountId=${accountId}`),
        api.get(`/api/analytics/ai-landing-pages?accountId=${accountId}`),
        api.get(`/api/analytics/ai-conversions?accountId=${accountId}`),
        api.get(`/api/analytics/ai-growth-mom?accountId=${accountId}`),
        api.get(`/api/analytics/ai-device-split?accountId=${accountId}`),
        api.get(`/api/analytics/demographics?accountId=${accountId}`),
      ]);
      // Extract data from settled promises, using empty arrays as fallbacks
      const endpoints = [
        'first-touch',
        'zero-touch',
        'ai-landing-pages',
        'ai-conversions',
        'ai-growth-mom',
        'ai-device-split',
        'demographics'
      ];

      const [
        firstTouchRes,
        zeroTouchRes,
        landingPagesRes,
        convRes,
        growthRes,
        deviceRes,
        demoRes,
      ] = results.map((result, index) => {
        if (result.status === 'fulfilled') {

          return result.value;
        } else {
          // Check if the error is about missing AI audience
          const errorMsg = result.reason?.response?.data?.error || result.reason?.message || '';
          const errorStatus = result.reason?.response?.status;

          console.error(` ${endpoints[index]} failed:`, {
            status: errorStatus,
            error: errorMsg,
            fullError: result.reason
          });

          if (errorMsg.includes('AI Traffic audience not found') || errorMsg.includes('audience')) {
            setMissingAudience(true);
          }

          console.warn(`Failed to load ${endpoints[index]}:`, errorMsg);
          return { data: [] };
        }
      });

      // Fetch topic clusters separately (optional, may not exist yet)
      let topicRes = { data: [] };
      try {
        topicRes = await api.get(
          `/api/analytics/topic-clusters?accountId=${accountId}`
        );
      } catch (error) {
        console.log("Topic clusters endpoint not available yet");
      }

      const fTouch = firstTouchRes.data || [];
      const zTouch = zeroTouchRes.data || [];
      const landingPages = landingPagesRes.data?.landingPageData || [];


      setChartData(mainData);
      setKeyMetrics(metrics);
      setAiModelsData(formattedAIModels);
      setFirstTouchData(fTouch);
      setZeroTouchData(zTouch);
      setAiLandingPageData(landingPages);
      setConversionRateData(convRes.data);
      setAiGrowthData(growthRes.data);
      setAiDeviceData(deviceRes.data);
      setTopicClusterData(topicRes.data);
      setDemographicsData(demoRes.data);



      // Save to cache
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          chartData: mainData,
          keyMetrics: metrics,
          aiModelsData: formattedAIModels,
          firstTouchData: fTouch,
          zeroTouchData: zTouch,
          aiLandingPageData: landingPages,
          conversionRateData: convRes.data,
          aiGrowthData: growthRes.data,
          aiDeviceData: deviceRes.data,
          topicClusterData: topicRes.data,
          demographicsData: demoRes.data,
          timestamp: Date.now(),
        })
      );


      setIsQuotaExceeded(false);
    } catch (error: any) {
      const isQuotaError =
        error.response?.status === 429 || error.message?.includes("quota");

      if (isQuotaError) {
        setIsQuotaExceeded(true);
        // Use warn instead of error to avoid the development overlay
        console.warn("GA Quota limit reached:", error.message);
        toast.error(
          "Analytics quota exceeded. This view will refresh once the quota is available."
        );
      } else {
        console.error("Failed to load GA account data:", error);
        toast.error("Failed to fetch analytics data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = () => {
    const client_id = process.env.NEXT_PUBLIC_GA_CLIENT_ID;
    const redirect_uri = `${window.location.origin}/api/auth/callback/google`;
    const scope = [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
    ].join(" ");
    const state = activeWorkspace?._id || "";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    toast.info("Redirecting to Google sign-in...");
    window.location.href = authUrl;
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this account?")) return;

    try {
      await api.delete(`/api/ga-accounts?id=${accountId}`);
      toast.success("Account removed successfully");
      loadGAAccounts();
      if (selectedAccountId === accountId) {
        setSelectedAccountId("");
        setChartData([]);
        setAiModelsData([]);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to remove account");
    }
  };
  const fetchPropertiesForAccount = async (accountId: string) => {
    if (propertiesMap[accountId]) return;
    setLoadingProperties(prev => ({ ...prev, [accountId]: true }));
    try {
      const res = await api.get(`/api/ga-accounts/${accountId}/properties`);
      setPropertiesMap(prev => ({ ...prev, [accountId]: res.data }))
    } catch (error) {
      console.error("Failed to fetch properties", error);
      toast.error("Could not load properties");
    } finally {
      setLoadingProperties(prev => ({ ...prev, [accountId]: false }));
    }
  }
  const handlePropertyChange = async (accountId: string, propertyId: string) => {
    const properties = propertiesMap[accountId];
    const selectedProp = properties?.find(p => p.id === propertyId);

    if (!selectedProp) return;

    try {
      await api.patch(`/api/ga-accounts/${accountId}`, {
        propertyId: selectedProp.id,
        propertyName: selectedProp.name
      });

      toast.success("Property updated successfully");

      // Update local state to reflect change immediately
      setGaAccounts(prev => prev.map(acc => {
        if (acc._id === accountId) {
          return { ...acc, propertyId: selectedProp.id, propertyName: selectedProp.name };
        }
        return acc;
      }));

      // Clear cache and reload
      const cacheKey = `ga-account-data-${accountId}`;
      sessionStorage.removeItem(cacheKey);

      // If this is the currently selected account, reload data
      if (selectedAccountId === accountId) {
        loadAccountData(accountId);
      }

    } catch (error) {
      console.error("Failed to update property", error);
      toast.error("Failed to update property");
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "";
    const dateStr = String(dateValue);
    if (dateStr.length !== 8) return dateStr;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen p-6 space-y-8 max-w-[1700px] mx-auto">
      {/* Header & Filter Bar */}
      {/* Header Section */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] -mx-6 -mt-6 mb-8">
        <div className="max-w-[1700px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <ChartBar className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Analytics</h1>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                Analyze AI mentions, sentiment patterns, and ranking trends.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {gaAccounts.length > 0 && (
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-full md:w-auto md:min-w-[160px] px-4 bg-slate-50 border-slate-200 h-10 font-bold text-[13px] rounded-xl transition-all hover:bg-white text-slate-900">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {gaAccounts.map((account) => {
                    const cleanName = account.propertyName
                      .replace(/GA4/gi, "")
                      .replace(/Google Analytics/gi, "")
                      .replace(/-/g, "")
                      .trim();

                    return (
                      <SelectItem key={account._id} value={account._id}>
                        <span className="font-bold text-slate-900">
                          {cleanName}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-900 shadow-none" title="Manage Accounts">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Manage GA4 Accounts</SheetTitle>
                  <SheetDescription>
                    Connect and manage your Google Analytics properties.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 px-4">
                  <Button
                    onClick={handleConnectAccount}
                    className="w-full bg-slate-900 hover:bg-black text-white h-11 rounded-xl font-bold text-[13px] shadow-lg shadow-slate-200"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Connect New Account
                  </Button>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Connected Accounts
                    </h3>
                    {gaAccounts.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="font-medium text-[13px]">No accounts connected</p>
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden shadow-sm">
                        {gaAccounts.map((account) => (
                          <div
                            key={account._id}
                            className="p-4 bg-white hover:bg-slate-50 transition-colors space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900 text-sm">
                                  {account.accountName}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                  Current Property: {account.propertyName}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAccount(account._id)}
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Property Selector */}
                            <div className="pt-2">
                              <Select
                                value={account.propertyId}
                                onValueChange={(val) => handlePropertyChange(account._id, val)}
                                onOpenChange={(isOpen) => {
                                  if (isOpen) fetchPropertiesForAccount(account._id);
                                }}
                              >
                                <SelectTrigger className="w-full h-9 text-xs bg-slate-100 border-slate-200">
                                  <SelectValue placeholder="Switch Property/App" />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingProperties[account._id] ? (
                                    <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                      Loading properties...
                                    </div>
                                  ) : (
                                    propertiesMap[account._id]?.map((prop) => (
                                      <SelectItem key={prop.id} value={prop.id} className="text-xs">
                                        {prop.name}
                                      </SelectItem>
                                    ))
                                  )}
                                  {propertiesMap[account._id]?.length === 0 && !loadingProperties[account._id] && (
                                    <div className="p-2 text-xs text-center text-muted-foreground">No other properties found</div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "space-y-8",
          !loading && "animate-in fade-in slide-in-from-bottom-2 duration-700"
        )}
      >
        {/* Quota Error Message */}
        {isQuotaExceeded && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardHeader>
              <CardTitle className="text-amber-800">Quota Exceeded</CardTitle>
              <CardDescription className="text-amber-700">
                The Google Analytics API quota for this property has been
                reached. Some data may not be up to date. The quota typically
                resets every hour.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Initial Loading State */}
        {initialLoading && (
          <div className="flex flex-col items-center justify-center h-[70vh] w-full gap-3 text-foreground/40">
            <Loader
              className="h-10 w-10 animate-spin text-foreground shrink-0"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium">Loading accounts...</p>
          </div>
        )}

        {/* Empty State if no account selected */}
        {!initialLoading &&
          !selectedAccountId &&
          !loading &&
          gaAccounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
              <div className="bg-white p-8 rounded-full shadow-lg mb-6">
                <Zap className="h-16 w-16 text-gray-300" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                No Analytics Data
              </h2>
              <p className="text-gray-500 max-w-md text-center mb-6">
                Connect your Google Analytics account to start tracking AI
                performance and insights.
              </p>
              <Button
                onClick={handleConnectAccount}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
              >
                Connect Google Analytics
              </Button>
            </div>
          )}

        {/* Analytics Charts */}
        {selectedAccountId &&
          !isQuotaExceeded &&
          (loading ? (
            <div className="flex flex-col items-center justify-center h-[70vh] w-full gap-3 text-foreground/40">
              <Loader
                className="h-10 w-10 animate-spin text-foreground shrink-0"
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium">loading data...</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
              {/* 1. Engagement and Quality Insights */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChartBar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Engagement & Quality
                  </h3>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    • Key metrics overview
                  </span>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-purple-50 rounded-xl border border-purple-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-purple-100 flex flex-row justify-between items-center shrink-0 bg-white/50">
                      <h3 className="font-bold text-[11px] uppercase tracking-wider text-purple-900">
                        AI Overview Clicks
                      </h3>
                      <div className="h-4 w-4 text-purple-400">
                        {/* You can use a specific icon here */}
                        <span className="text-xs">✨</span>
                      </div>
                    </div>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-900">
                        {(keyMetrics.aiOverviewClicks ?? 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-purple-600/80 mt-1">
                        Visits via "AI Overview" highlights
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                      <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                        Active Users
                      </h3>
                      <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">
                        {keyMetrics.activeUsers}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total active users in period
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                      <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                        Engaged Sessions
                      </h3>
                      <MousePointerClick className="h-4 w-4 text-slate-400" />
                    </div>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">
                        {keyMetrics.engagedSessions}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sessions longer than 10s
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                      <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                        Key Events
                      </h3>
                      <Zap className="h-4 w-4 text-slate-400" />
                    </div>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">
                        {keyMetrics.keyEvents}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Conversions and important actions
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Website Traffic Chart */}

                <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100  px-5 ">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                          Website Traffic Trends
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-500 font-medium">
                          Daily active users comparing Total vs AI traffic
                        </CardDescription>
                      </div>
                      <InfoTooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Shows daily active user trends comparing total website traffic with AI-referred traffic
                        </TooltipContent>
                      </InfoTooltip>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                            tickFormatter={formatDate}
                          />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#1e40af"
                            strokeWidth={3}
                            name="Total Users"
                            dot={{ fill: "#1e40af", r: 1 }}
                            activeDot={{ r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="aiUsers"
                            stroke="#059669"
                            strokeWidth={3}
                            name="AI Traffic"
                            dot={{ fill: "#059669", r: 1 }}
                            activeDot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 2. User Journey and Conversion */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    User Journey & Conversion
                  </h3>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    • Attribution analysis
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* First touch chart */}
                  <FirstZeroTouchChart
                    data={firstTouchData}
                    loading={loading}
                    formatDate={formatDate}
                  />
                  {/* Zero touch chart */}
                  <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100  px-5 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                            Zero Touch Attribution
                          </CardTitle>
                          <CardDescription className="text-[10px] text-slate-500 font-medium">
                            Brand awareness & indirect influence
                          </CardDescription>
                        </div>
                        <InfoTooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Tracks impressions and brand searches where users don't directly click but are influenced by brand awareness
                          </TooltipContent>
                        </InfoTooltip>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loading ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                      ) : zeroTouchData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart
                            data={zeroTouchData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="colorImpressions"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#9333ea"
                                  stopOpacity={0.1}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#9333ea"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#94a3b8"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={formatDate}
                              dy={10}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              dx={-10}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "none",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                padding: "12px",
                              }}
                              cursor={{
                                stroke: "#cbd5e1",
                                strokeWidth: 1,
                                strokeDasharray: "4 4",
                              }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            <Line
                              type="monotone"
                              dataKey="impressions"
                              stroke="#9333ea"
                              strokeWidth={3}
                              name="Impressions"
                              dot={{
                                fill: "#9333ea",
                                r: 0,
                                strokeWidth: 0,
                                stroke: "#fff",
                              }}
                              activeDot={{ r: 4, strokeWidth: 0 }}
                              fill="url(#colorImpressions)"
                            />
                            <Line
                              type="monotone"
                              dataKey="brandSearches"
                              stroke="#ec4899"
                              strokeWidth={3}
                              name="Brand Searches"
                              dot={{
                                fill: "#ec4899",
                                r: 0,
                                strokeWidth: 0,
                                stroke: "#fff",
                              }}
                              activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                          <Users className="h-10 w-10 mb-3 opacity-20" />
                          <p className="font-medium">
                            No zero touch data available
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Conversion Rate Charttt */}
                  <div className="col-span-1 lg:col-span-2">
                    <AIConversionRateChart data={conversionRateData} />
                  </div>
                </div>
              </div>

              {/* 3. Content Performance (AEO Specific) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Content Performance
                  </h3>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    • AEO Specific Insights
                  </span>
                </div>

                {/* Topic Clusters & Growth */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <TopicClustersTreemap data={topicClusterData} />
                  </div>
                  <AIGrowthRateChart data={aiGrowthData} loading={loading} />

                  {/* AI Models Distribution Pie */}
                  <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100  px-5 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                            AI Models Distribution
                          </CardTitle>
                          <CardDescription className="text-[10px] text-slate-500 font-medium">
                            Traffic share by AI model
                          </CardDescription>
                        </div>
                        <InfoTooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Breakdown of user traffic distribution across different AI models (ChatGPT, Copilot, Perplexity, etc.)
                          </TooltipContent>
                        </InfoTooltip>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                      {loading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <CitationsPieChart
                          data={aiModelsData
                            .filter((item) => item.users > 0)
                            .map((item, index) => {
                              const colors = [
                                "#10B981", // ChatGPT - green
                                "#3B82F6", // Copilot - blue
                                "#8B5CF6", // Perplexity - purple
                                "#F97316", // Gemini - orange
                                "#06B6D4", // Claude - cyan
                              ];
                              return {
                                name: item.model,
                                value: item.users,
                                color: colors[index % colors.length],
                              };
                            })}
                          totalCitations={aiModelsData.reduce(
                            (sum, item) => sum + item.users,
                            0
                          )}
                          label="Total Users"
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Traffic by AI Model Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <Card className="col-span-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100  px-5 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                            Traffic by AI model
                          </CardTitle>
                          <CardDescription className="text-[10px] text-slate-500 font-medium">
                            Users from AI sources (Last 30 Days)
                          </CardDescription>
                        </div>
                        <InfoTooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Bar chart showing the number of active users coming from each AI model over the last 30 days
                          </TooltipContent>
                        </InfoTooltip>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={aiModelsData.filter((item) => item.users > 0)}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="users" fill="#1e40af" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-1 bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                    <CardHeader className="border-b border-slate-100  px-5 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                            AI Models Performance
                          </CardTitle>
                          <CardDescription className="text-[10px] text-slate-500 font-medium">
                            Detailed metrics for each AI model
                          </CardDescription>
                        </div>
                        <InfoTooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Detailed performance metrics including active users, sessions, and conversion rates for each AI model
                          </TooltipContent>
                        </InfoTooltip>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                      {loading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>AI Model</TableHead>
                              <TableHead>Active Users</TableHead>
                              <TableHead>Sessions</TableHead>
                              <TableHead>Cv Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aiModelsData.filter((row) => row.users > 0)
                              .length > 0 ? (
                              aiModelsData
                                .filter((row) => row.users > 0)
                                .map((row, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">
                                      {row.model}
                                    </TableCell>
                                    <TableCell>{row.users || 0}</TableCell>
                                    <TableCell>{row.sessions || 0}</TableCell>
                                    <TableCell>
                                      {row.conversionRate || "0%"}
                                    </TableCell>
                                  </TableRow>
                                ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No AI model data available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Landing Pages */}
                <Card className=" bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100  px-5 ">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                          AI Traffic Landing pages
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-500 font-medium">
                          Top pages where AI-referred user land
                        </CardDescription>
                      </div>
                      <InfoTooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Shows the top landing pages and entry points for users coming from AI sources with their traffic distribution
                        </TooltipContent>
                      </InfoTooltip>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader className="h-8 w-8 animate-spin text-purple-600" />
                      </div>
                    ) : aiLandingPageData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <div className="text-sm font-medium text-gray-700">
                            Total Pages:{" "}
                            <span className="text-purple-600">
                              {aiLandingPageData.length}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            Total Users:{" "}
                            <span className="text-purple-600">
                              {aiLandingPageData.reduce(
                                (sum, item) => sum + item.users,
                                0
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-purple-50">
                                <TableHead className="font-semibold">
                                  #
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Landing Page
                                </TableHead>
                                <TableHead className="font-semib    old">
                                  Source
                                </TableHead>
                                <TableHead className="font-semibold text-right">
                                  Users
                                </TableHead>
                                <TableHead className="font-semibold text-right">
                                  Share
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {aiLandingPageData.map((item, index) => {
                                const totalUsers = aiLandingPageData.reduce(
                                  (sum, i) => sum + i.users,
                                  0
                                );
                                const percentage = (
                                  (item.users / totalUsers) *
                                  100
                                ).toFixed(1);

                                return (
                                  <TableRow
                                    key={index}
                                    className="hover:bg-purple-50/50 transition-colors"
                                  >
                                    <TableCell className="font-medium text-gray-600">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                      <div className="flex items-center gap-2">
                                        <span className="truncate font-medium text-sm">
                                          {item.page === "(not set)"
                                            ? "Homepage"
                                            : item.page}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {item.source}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="font-semibold text-gray-900">
                                        {item.users}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                          {percentage}%
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
                        <p className="text-lg font-medium">
                          No AI landing page data available
                        </p>
                        <p className="text-sm mt-2">
                          Check back later for AI traffic insights
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 4. Technical and Demographics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Technical & Demographics
                  </h3>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    • Device breakdown
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AIDeviceBreakdownChart
                    data={aiDeviceData}
                    loading={loading}
                  />
                  <AiDemographicsChart data={demographicsData} />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
