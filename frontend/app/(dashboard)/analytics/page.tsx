"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/api";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
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
import { Tag } from "lucide-react";
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
  TrafficCone,
  LucideTrafficCone,
  Group,
  FileSpreadsheet,
  Search,
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
import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import { DialogContent, DialogHeader } from "@/components/ui/dialog";
import { AiOverviewStats } from "@/components/Charts/AiOverviewStats";
import { RangeCalendar } from "@/components/RangeCalendar";
import { subDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { ButtonGroup } from "@/components/ui/button-group";
import { exportAnalyticsToExcel } from "@/lib/utils/excel-export";

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
  const [loadingProperties, setLoadingProperties] = useState<
    Record<string, boolean>
  >({});

  const [conversionRateData, setConversionRateData] = useState<any[]>([]);
  const [topicClusterData, setTopicClusterData] = useState<any[]>([]);
  const [aiGrowthData, setAiGrowthData] = useState<any[]>([]);
  const [aiDeviceData, setAiDeviceData] = useState<any[]>([]);
  const [demographicsData, setDemographicsData] = useState<any[]>([]);
  // const [missingAudience, setMissingAudience] = useState(false);
  const [searchConsoleData, setSearchConsoleData] = useState<any>(null);
  const [scLoading, setScLoading] = useState(false);
  const [scSites, setScSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [scChartData, setScChartData] = useState<any[]>([]);
  const [scLimit, setScLimit] = useState<string>("50");
  const [scTopQueries, setScTopQueries] = useState<any[]>([]);
  const [isGtmDialogOpen, setIsGtmDialogOpen] = useState(false);
  const [gtmContainers, setGtmContainers] = useState<any[]>([]);
  const [selectedGtmContainer, setSelectedGtmContainer] = useState<string>("");
  const [activeSetupAccount, setActiveSetupAccount] = useState<any>(null);
  const [aiOverviewStats, setAiOverviewStats] = useState<{
    pages: any[];
    devices: any[];
  }>({ pages: [], devices: [] });
  const [activeView, setActiveView] = useState<
    "ai-analytics" | "search-console"
  >("ai-analytics");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [limit, setLimit] = useState<string>("10");

  // GSC property management state
  const [gscAccount, setGscAccount] = useState<any>(null);
  const [gscProperties, setGscProperties] = useState<any[]>([]);
  const [loadingGscProperties, setLoadingGscProperties] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [installationGtmId, setInstallationGtmId] = useState("");

  // OPTIMIZATION: Memoize loadGAAccounts to prevent recreation
  const loadGAAccounts = useCallback(async () => {
    if (!activeWorkspace?._id) {
      setGaAccounts([]);
      setInitialLoading(false);
      return;
    }

    try {
      // No cache - fetch fresh data
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

  // Load Search Console Account (separate from GA)
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

  useEffect(() => {
    if (activeWorkspace?._id) {
      // Reset ALL state to ensure clean transition and prevent stale data
      // This ensures complete data isolation between workspaces

      // GA Accounts & Selection
      setGaAccounts([]);
      setSelectedAccountId("");

      // Chart & Analytics Data
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

      // Key Metrics
      setKeyMetrics({
        activeUsers: 0,
        engagedSessions: 0,
        keyEvents: 0,
        aiOverviewClicks: 0,
      });

      // Search Console Data - CRITICAL for workspace isolation
      setSearchConsoleData(null);
      setScChartData([]);
      setScTopQueries([]);
      setScSites([]);
      setSelectedSite("");
      setGscAccount(null);
      setScLoading(false);

      // AI Overview Stats
      setAiOverviewStats({ pages: [], devices: [] });

      // Other flags
      setIsQuotaExceeded(false);
      setScLimit("50");

      setInitialLoading(true);
      loadGAAccounts();
      loadGscAccount(); // Load GSC separately
    }
  }, [activeWorkspace?._id, loadGAAccounts, loadGscAccount]);

  // Handle OAuth callback - force refresh when account is connected
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const gscConnected = urlParams.get("gsc_connected");

    if (connected === "true" && activeWorkspace?._id) {
      // Remove the query parameter from URL
      window.history.replaceState({}, "", window.location.pathname);

      // Force reload accounts
      loadGAAccounts();
      loadGscAccount();
      toast.success("Google Analytics connected successfully!");
    }

    if (gscConnected === "true" && activeWorkspace?._id) {
      // Remove the query parameter from URL
      window.history.replaceState({}, "", window.location.pathname);

      // Force reload GSC account
      loadGscAccount();
      toast.success("Search Console connected successfully!");
    }
  }, [activeWorkspace?._id, loadGAAccounts, loadGscAccount]);

  const loadAccountData = useCallback(
    async (accountId: string) => {
      if (!accountId || isQuotaExceeded) {
        return;
      }

      setLoading(true);
      // setMissingAudience(false); // Reset the warning

      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : "30daysAgo";
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : "today";
      const dateParams = `&startDate=${startDate}&endDate=${endDate}`;
      try {
        // OPTIMIZATION: Fetch ALL data in parallel instead of sequentially
        const results = await Promise.allSettled([
          api.get(
            `/api/analytics-by-account?accountId=${accountId}${dateParams}`
          ),
          api.get(
            `/api/ai-models-by-account?accountId=${accountId}${dateParams}`
          ),
          api.get(
            `/api/analytics/ai-overview-stats?accountId=${accountId}${dateParams}`
          ),
          api.get(`/api/analytics/first-touch?accountId=${accountId}`),
          api.get(
            `/api/analytics/zero-touch?accountId=${accountId}${dateParams}`
          ),
          api.get(
            `/api/analytics/ai-landing-pages?accountId=${accountId}${dateParams}&limit=${limit}`
          ),
          api.get(
            `/api/analytics/ai-conversions?accountId=${accountId}${dateParams}`
          ),
          api.get(`/api/analytics/ai-growth-mom?accountId=${accountId}`),
          api.get(
            `/api/analytics/ai-device-split?accountId=${accountId}${dateParams}`
          ),
          api.get(
            `/api/analytics/demographics?accountId=${accountId}${dateParams}`
          ),
          api.get(
            `/api/analytics/topic-clusters?accountId=${accountId}${dateParams}`
          ),
        ]);
        // Extract data from settled promises, using empty arrays as fallbacks
        const endpoints = [
          "analytics-by-account",
          "ai-models-by-account",
          "ai-overview-stats",
          "first-touch",
          "zero-touch",
          "ai-landing-pages",
          "ai-conversions",
          "ai-growth-mom",
          "ai-device-split",
          "demographics",
          "topic-clusters",
        ];

        const [
          analyticsRes,
          aiModelsRes,
          aiStatsRes,
          firstTouchRes,
          zeroTouchRes,
          landingPagesRes,
          convRes,
          growthRes,
          deviceRes,
          demoRes,
          topicRes,
        ] = results.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            // Check if the error is about missing AI audience or permissions
            const errorMsg =
              result.reason?.response?.data?.error ||
              result.reason?.message ||
              "";
            const errorStatus = result.reason?.response?.status;
            const needsPermissions =
              result.reason?.response?.data?.needsPermissions;

            console.error(` ${endpoints[index]} failed:`, {
              status: errorStatus,
              error: errorMsg,
              fullError: result.reason,
            });

            // Handle permission errors
            if (
              errorStatus === 403 ||
              needsPermissions ||
              errorMsg.includes("permission")
            ) {
              console.warn(`Permission error for ${endpoints[index]}`);
              if (endpoints[index] === "first-touch") {
                toast.error(
                  "GA4 Permission Required: Please reconnect with Editor or Admin role to create audiences"
                );
              }
            }
            // Handle audience-related errors
            else if (
              errorMsg.includes("AI Traffic audience") ||
              errorMsg.includes("audience") ||
              errorMsg.includes("Could not create") ||
              errorMsg.toLowerCase().includes("audience")
            ) {
              // setMissingAudience(true);
            }

            console.warn(`Failed to load ${endpoints[index]}:`, errorMsg);
            return {
              data:
                endpoints[index] === "analytics-by-account"
                  ? {
                      chartData: [],
                      metrics: {
                        activeUsers: 0,
                        engagedSessions: 0,
                        keyEvents: 0,
                      },
                    }
                  : [],
            };
          }
        });

        // Process analytics data
        const mainData = analyticsRes.data?.chartData || [];
        const metrics = analyticsRes.data?.metrics || {
          activeUsers: 0,
          engagedSessions: 0,
          keyEvents: 0,
        };

        // Process AI models data
        const allowedModels = [
          "ChatGPT",
          "Copilot",
          "Perplexity",
          "Gemini",
          "Claude",
        ];
        const formattedAIModels = allowedModels.map((modelName) => {
          const existingData = aiModelsRes.data?.find(
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

        const fTouch = firstTouchRes.data || [];
        const zTouch = zeroTouchRes.data || [];
        const landingPages = landingPagesRes.data?.landingPageData || [];

        // OPTIMIZATION: Batch state updates to reduce re-renders
        setChartData(mainData);
        setKeyMetrics(metrics);
        setAiModelsData(formattedAIModels);
        setAiOverviewStats(aiStatsRes.data || { pages: [], devices: [] });
        setFirstTouchData(fTouch);
        setZeroTouchData(zTouch);
        setAiLandingPageData(landingPages);
        setConversionRateData(convRes.data || []);
        setAiGrowthData(growthRes.data || []);
        setAiDeviceData(deviceRes.data || []);
        setTopicClusterData(topicRes.data || []);
        setDemographicsData(demoRes.data || []);

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
    },
    [isQuotaExceeded, dateRange]
  ); // Search Console loads independently via separate effect

  // Trigger data load when account or date range changes
  useEffect(() => {
    if (selectedAccountId && dateRange?.from && dateRange?.to) {
      loadAccountData(selectedAccountId);
    }
  }, [selectedAccountId, dateRange, loadAccountData]);

  // NEW: Dedicated function to reload ONLY landing pages when limit changes
  const loadLandingPagesOnly = useCallback(
    async (accountId: string) => {
      if (!accountId) return;

      // Use a separate loading state or just strict local update?
      // Ideally we might want a local loading state for the table, but for now we'll just update the data.
      // If we want a spinner on the table, we'd need a separate `isTableLoading` state.

      try {
        const startDate = dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : "30daysAgo";
        const endDate = dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : "today";
        const dateParams = `&startDate=${startDate}&endDate=${endDate}`;

        const res = await api.get(
          `/api/analytics/ai-landing-pages?accountId=${accountId}${dateParams}&limit=${limit}`
        );
        setAiLandingPageData(res.data?.landingPageData || []);
      } catch (error) {
        console.error("Failed to reload landing pages:", error);
      }
    },
    [limit, dateRange]
  );

  // Effect to trigger ONLY the landing page reload when limit changes (debounced)
  useEffect(() => {
    if (!selectedAccountId || initialLoading) return;

    const timer = setTimeout(() => {
      loadLandingPagesOnly(selectedAccountId);
    }, 300);

    return () => clearTimeout(timer);
  }, [limit, selectedAccountId, loadLandingPagesOnly, initialLoading]);

  const loadSearchConsoleSites = useCallback(async (accountId: string) => {
    try {
      const response = await api.get(
        `/api/search-console/sites?accountId=${accountId}`
      );
      setScSites(response.data.sites || []);
    } catch (error: any) {
      console.error("Failed to load Search Console sites:", error);
      toast.error("Failed to load Search Console sites");
    }
  }, []);

  const linkSearchConsoleSite = async (accountId: string, siteUrl: string) => {
    try {
      await api.post("/api/search-console/link", { accountId, siteUrl });
      toast.success("Search Console linked successfully!");
      loadSearchConsoleData(accountId);
    } catch (error: any) {
      console.error("Failed to link site:", error);
      toast.error("Failed to link Search Console");
    }
  };

  const loadSearchConsoleData = useCallback(
    async (accountId: string) => {
      setScLoading(true);

      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : "30daysAgo";
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : "today";
      const dateParams = `&startDate=${startDate}&endDate=${endDate}`;

      try {
        // Fetch BOTH chart data and top queries
        const [chartResponse, queriesResponse] = await Promise.all([
          api.get(
            `/api/search-console/queries?accountId=${accountId}${dateParams}`
          ),
          api.get(
            `/api/search-console/top-queries?accountId=${accountId}&limit=${scLimit}${dateParams}`
          ),
        ]);

        setScChartData(chartResponse.data.chartData || []);
        setSearchConsoleData({ totals: chartResponse.data.totals });
        setScTopQueries(queriesResponse.data.queries || []);
      } catch (error: any) {
        console.error("Search Console data error:", error);

        const errorMsg = error.response?.data?.error || "";
        const needsPropertySelection =
          error.response?.data?.needsPropertySelection;

        // If property not selected, try to load available properties
        if (
          needsPropertySelection ||
          errorMsg.includes("not selected") ||
          errorMsg.includes("not configured")
        ) {
          console.log("Property not selected, loading available sites...");
          loadSearchConsoleSites(accountId);
        }
        // Silently handle other errors - no toast message for non-critical failures
      } finally {
        setScLoading(false);
      }
    },
    [scLimit, dateRange, loadSearchConsoleSites]
  );

  // Load Search Console data when GSC account, limit, or date changes
  useEffect(() => {
    if (gscAccount?._id && gscAccount?.siteUrl && !isQuotaExceeded) {
      loadSearchConsoleData(gscAccount._id);
    }
  }, [scLimit, gscAccount, isQuotaExceeded, dateRange, loadSearchConsoleData]);

  const handleConnectAccount = () => {
    const client_id = process.env.NEXT_PUBLIC_GA_CLIENT_ID;
    const redirect_uri = `${window.location.origin}/api/auth/callback/google`;
    const scope = [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/tagmanager.edit.containers",
      "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
      "https://www.googleapis.com/auth/tagmanager.publish",
      "https://www.googleapis.com/auth/tagmanager.readonly",
    ].join(" ");
    const state = activeWorkspace?._id || "";
    // Add timestamp to force fresh consent and prevent caching
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}&login_hint=${Date.now()}`;

    console.log("Requesting OAuth with scopes:", scope);
    toast.info("Redirecting to Google sign-in...");
    window.location.href = authUrl;
  };
  // const fetchGtmContainers = async (accountId: string) => {
  //   setGtmLoading(true);
  //   try {
  //     const res = await api.get(`/api/gtm/containers?accountId=${accountId}`);
  //     setGtmContainers(res.data);
  //     setIsGtmDialogOpen(true);
  //   } catch (error) {
  //     toast.error("Failed to load GTM containers. Please reconnect account with permissions.");
  //   } finally {
  //     setGtmLoading(false);
  //   }
  // };

  const handleGtmSetup = async (dbAccountId: string, measurementId: string) => {
    if (!selectedGtmContainer) return;

    // Find the full container object to get the internal gtmAccountId
    const container = gtmContainers.find(
      (c) => c.publicId === selectedGtmContainer
    );
    if (!container) return;

    try {
      // setGtmLoading(true);
      // toast.info("Configuring GTM...");

      const response = await api.post("/api/gtm/setup", {
        dbAccountId,
      });

      const result = response.data;

      // Show appropriate message based on status
      if (result.status === "Configured and Published") {
        toast.success(result.message || "Success! GTM tracking is now live!");

        // Show installation instructions
        setInstallationGtmId(container.publicId); // Use the public GTM ID (GTM-XXXXX)
        setShowInstallInstructions(true);
      } else {
        // Partial success - configured but not published
        toast.success(result.message || "GTM configured successfully!");
        if (result.warning) {
          setTimeout(() => {
            toast.warning(result.warning, { duration: 8000 });
          }, 500);
        }
      }

      setIsGtmDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      const errorMsg =
        e.response?.data?.error || "Setup failed. Check console for details.";
      toast.error(errorMsg);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this account?")) return;

    try {
      await api.delete(`/api/ga-accounts?id=${accountId}`);
      toast.success("Account removed successfully");

      // Reload accounts
      await loadGAAccounts();

      // If the deleted account was selected, clear the selection
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
  const fetchPropertiesForAccount = useCallback(
    async (accountId: string) => {
      if (propertiesMap[accountId]) return;
      setLoadingProperties((prev) => ({ ...prev, [accountId]: true }));
      try {
        const res = await api.get(`/api/ga-accounts/${accountId}/properties`);
        const properties = res.data;
        setPropertiesMap((prev) => ({ ...prev, [accountId]: properties }));

        // Auto-select logic: If only 1 property exists and none is selected, select it automatically
        if (properties && properties.length === 1) {
          const account = gaAccounts.find((a) => a._id === accountId);
          if (account && !account.propertyId) {
            const singleProp = properties[0];
            try {
              await api.patch(`/api/ga-accounts/${accountId}`, {
                propertyId: singleProp.id,
                propertyName: singleProp.name,
              });
              // Toast removed for seamless auto-selection

              // Update local state immediately
              setGaAccounts((prev) =>
                prev.map((acc) => {
                  if (acc._id === accountId) {
                    return {
                      ...acc,
                      propertyId: singleProp.id,
                      propertyName: singleProp.name,
                    };
                  }
                  return acc;
                })
              );

              // Trigger data load if this is the active account
              if (selectedAccountId === accountId) {
                loadAccountData(accountId);
              }
            } catch (err) {
              console.error("Auto-select property failed:", err);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch properties", error);
        toast.error("Could not load properties");
      } finally {
        setLoadingProperties((prev) => ({ ...prev, [accountId]: false }));
      }
    },
    [gaAccounts, propertiesMap, selectedAccountId, loadAccountData]
  );

  // Auto-fetch properties if selected account doesn't have a property set
  useEffect(() => {
    if (selectedAccountId && gaAccounts.length > 0) {
      const account = gaAccounts.find((a) => a._id === selectedAccountId);
      if (account && !account.propertyId) {
        // Fetch properties to see if we can auto-select one
        fetchPropertiesForAccount(selectedAccountId);
      }
    }
  }, [selectedAccountId, gaAccounts, fetchPropertiesForAccount]);

  // Handle property change for GA account
  // When a property is switched, we need to:
  // 1. Update the account in the database
  // 2. Clear audience data (audiences are property-specific)
  // 3. Update local state
  // 4. Reload analytics data for the new property
  const handlePropertyChange = async (
    accountId: string,
    propertyId: string,
    forceSwitch = false
  ) => {
    const properties = propertiesMap[accountId];
    const selectedProp = properties?.find((p) => p.id === propertyId);

    if (!selectedProp) return;

    try {
      const response = await api.patch(`/api/ga-accounts/${accountId}`, {
        propertyId: selectedProp.id,
        propertyName: selectedProp.name,
        forceSwitch,
      });

      toast.success("Property updated successfully");

      // Update local state to reflect change immediately
      setGaAccounts((prev) =>
        prev.map((acc) => {
          if (acc._id === accountId) {
            return {
              ...acc,
              propertyId: selectedProp.id,
              propertyName: selectedProp.name,
              // Clear audience data when switching properties
              aiAudienceId: null,
              aiAudienceName: null,
            };
          }
          // If this property was used by another account, clear it
          if (
            acc.propertyId === selectedProp.id &&
            acc._id !== accountId &&
            forceSwitch
          ) {
            return {
              ...acc,
              propertyId: undefined,
              propertyName: undefined,
              aiAudienceId: null,
              aiAudienceName: null,
            };
          }
          return acc;
        })
      );

      // If this is the currently selected account, reload data immediately
      if (selectedAccountId === accountId) {
        // Clear existing data first to show loading state
        setChartData([]);
        setAiModelsData([]);
        setAiLandingPageData([]);

        // Reload fresh data for the new property
        await loadAccountData(accountId);
      }
    } catch (error: any) {
      console.error("Failed to update property", error);
      console.log("Error response:", error.response);
      console.log("Error status:", error.response?.status);
      console.log("Error data:", error.response?.data);

      // Check if this is a conflict error that can be resolved by force switching
      if (
        error.response?.status === 409 &&
        error.response?.data?.canForceSwitch
      ) {
        const conflictingAccount = error.response.data.conflictingAccountName;
        console.log("Showing confirmation dialog for:", conflictingAccount);

        const confirmed = confirm(
          `This property is currently connected to "${conflictingAccount}".\n\n` +
            `Would you like to switch it to this account? This will disconnect it from "${conflictingAccount}".`
        );

        console.log("User confirmed:", confirmed);

        if (confirmed) {
          // Retry with forceSwitch flag
          console.log("Retrying with forceSwitch=true");
          return handlePropertyChange(accountId, propertyId, true);
        } else {
          toast.info("Property change cancelled");
        }
      } else {
        const errorMessage =
          error.response?.data?.details ||
          error.response?.data?.error ||
          "Failed to update property";
        toast.error(errorMessage);
      }
    }
  };

  // NEW: Independent OAuth handler for GSC
  const handleConnectGscAccount = () => {
    if (!activeWorkspace?._id) {
      toast.error("No workspace selected");
      return;
    }

    const client_id = process.env.NEXT_PUBLIC_GA_CLIENT_ID;
    const redirect_uri = `${window.location.origin}/api/auth/callback/search-console`;
    const scope = "https://www.googleapis.com/auth/webmasters.readonly";
    const state = activeWorkspace._id;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    toast.info("Redirecting to Google for Search Console access...");
    window.location.href = authUrl;
  };

  // NEW: Fetch GSC properties for property selection
  // NEW: Fetch GSC properties for property selection
  const fetchGscProperties = useCallback(async (accountId: string) => {
    setLoadingGscProperties(true);
    try {
      const res = await api.get(
        `/api/search-console/sites?accountId=${accountId}`
      );
      const sites = res.data.sites || [];
      const message = res.data.message;

      setGscProperties(sites);

      // Show helpful message if no sites found
      if (sites.length === 0 && message) {
        console.log("No GSC properties available:", message);
        toast.info(message);
      }

      // Auto-select if only one property
      if (sites.length === 1) {
        const singleSite = sites[0].siteUrl;
        await linkGscProperty(accountId, singleSite, false);
      }
    } catch (error: any) {
      console.error("Failed to fetch GSC properties:", error);
      const needsReconnect = error.response?.data?.needsReconnect;
      const errorMsg = error.response?.data?.error;

      if (needsReconnect || error.response?.status === 403) {
        toast.error(
          errorMsg || "Permission error. Please reconnect Search Console."
        );
      }
    } finally {
      setLoadingGscProperties(false);
    }
  }, []);

  // NEW: Auto-fetch GSC properties if account connected but no site selected
  useEffect(() => {
    if (gscAccount && gscAccount._id && !gscAccount.siteUrl) {
      fetchGscProperties(gscAccount._id);
    }
  }, [gscAccount, fetchGscProperties]);

  // NEW: Link a property to GSC account
  const linkGscProperty = async (
    accountId: string,
    siteUrl: string,
    showToast = true
  ) => {
    try {
      await api.post("/api/search-console/link", { accountId, siteUrl });
      await loadGscAccount(); // Reload to update UI
      // Trigger data fetch immediately for the linked account
      await loadSearchConsoleData(accountId);
      if (showToast) toast.success("Property linked successfully!");
    } catch (error) {
      console.error("Failed to link property:", error);
      if (showToast) toast.error("Failed to link property");
    }
  };

  // NEW: Handle property change from dropdown
  const handleGscPropertyChange = async (
    accountId: string,
    siteUrl: string
  ) => {
    await linkGscProperty(accountId, siteUrl);
  };

  // OPTIMIZATION: Memoize formatDate to prevent recreation
  const formatDate = useCallback((dateValue: any) => {
    if (!dateValue) return "";
    const dateStr = String(dateValue);
    if (dateStr.length !== 8) return dateStr;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  // Excel Export Handler
  const handleExcelExport = async () => {
    if (!activeWorkspace || !selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }

    setExporting(true);
    try {
      await exportAnalyticsToExcel({
        workspaceName: activeWorkspace.name || "Analytics",
        keyMetrics,
        chartData,
        aiModelsData,
        aiLandingPageData,
        scTopQueries,
        scChartData,
        searchConsoleData,
        aiOverviewStats,
        firstTouchData,
        zeroTouchData,
        conversionRateData,
        topicClusterData,
        aiGrowthData,
        aiDeviceData,
        demographicsData,
      });
      toast.success("Excel report downloaded successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export Excel report");
    } finally {
      setExporting(false);
    }
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                Analytics
              </h1>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                Analyze AI mentions, sentiment patterns, and search traffic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={handleExcelExport}
              disabled={exporting || !selectedAccountId}
              className="h-8 px-3 rounded-xl bg-black hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
              title="Export into Excel"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-0.5 animate-spin" />
                  <span className="text-sm font-medium">Export</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-0.5" />
                  <span className="text-sm font-medium">Export</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-900 shadow-none"
              title="Manage Accounts"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Manage Analytics & Search Console</SheetTitle>
                  <SheetDescription>
                    Connect and manage your Google Analytics and Search Console
                    properties.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 px-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Google Analytics Properties
                      </h3>
                    </div>

                    {gaAccounts.length === 0 && (
                      <Button
                        onClick={handleConnectAccount}
                        className="w-full bg-slate-900 hover:bg-black text-white h-11 rounded-xl font-bold text-[13px] shadow-lg shadow-slate-200"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Connect GA Account
                      </Button>
                    )}
                    {gaAccounts.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="font-medium text-[13px]">
                          No accounts connected
                        </p>
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
                                <p className="font-bold text-slate-900 text-base">
                                  {account.accountName}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-500 tracking-tight">
                                  Active Property • {account.propertyName}
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
                            <Button
                              variant="outline"
                              onClick={() => {
                                setActiveSetupAccount(account);
                                setShowInstallInstructions(true);
                              }}
                            >
                              <Tag className="w-3 h-3 mr-2" />
                              Setup AI Overview Tracking
                            </Button>


                            <div className="pt-2">
                              <Select
                                value={account.propertyId}
                                onValueChange={(val) =>
                                  handlePropertyChange(account._id, val)
                                }
                                onOpenChange={(isOpen) => {
                                  if (isOpen)
                                    fetchPropertiesForAccount(account._id);
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
                                    (propertiesMap[account._id]?.length
                                      ? propertiesMap[account._id]
                                      : [
                                          {
                                            id: account.propertyId,
                                            name: account.propertyName,
                                          },
                                        ]
                                    ).map((prop) => (
                                      <SelectItem
                                        key={prop.id}
                                        value={prop.id}
                                        className="text-xs"
                                      >
                                        {prop.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Overview Tracking Instructions Dialog - MOVED Outside Loop */}
                  <Dialog
                    open={showInstallInstructions}
                    onOpenChange={setShowInstallInstructions}
                  >
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">
                          AI Overview Tracking Setup
                        </DialogTitle>
                        <p className="text-sm text-slate-600 mt-2">
                          Add this simple code to your client's
                          website to track AI Overview clicks.
                        </p>
                      </DialogHeader>

                      <div className="space-y-8 pt-4">
                        {/* Step 1 */}
                        <div className="group relative rounded-lg border border-slate-200 bg-slate-50 p-5">
                            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-4 border-white text-white font-bold shadow-sm">
                                1
                            </div>
                            <h3 className="mb-2 font-bold text-slate-900 ml-3">Find GA4 Tracking Code</h3>
                            <p className="text-sm text-slate-600 ml-3">
                                Check the <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-semibold">&lt;head&gt;</code> section of your client's website for the Google Analytics script.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="group relative rounded-lg border border-slate-200 bg-slate-50 p-5">
                            <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-4 border-white text-white font-bold shadow-sm">
                                2
                            </div>
                            <h3 className="mb-2 font-bold text-slate-900 ml-3">Insert Tracking Script</h3>
                            <p className="text-sm text-slate-600 ml-3 mb-4">
                                Paste the snippet below immediately after the line <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-semibold">gtag('config', 'G-XXXX');</code>.
                            </p>

                            <div className="relative rounded-md bg-slate-900 mx-3">
                                <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-300 font-mono">
{`// AI Overview Detection (Performance API)
(function(){try{var n=performance.getEntriesByType('navigation')[0];
var u=n?n.name:document.URL;
if(u.includes(':~:text=')){
  var r=0,s=function(){
    var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
    if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
    else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
    else if(r++<50){setTimeout(s,200);}
  };s();
}}catch(e){}})();`}
                                </pre>
                                <Button
                                  size="sm"
                                  variant="secondary" 
                                  className="absolute right-2 top-2 h-7 px-2 text-xs hover:bg-slate-700 hover:text-white bg-slate-800 text-slate-400 border border-slate-700"
                                  onClick={() => {
                                      navigator.clipboard.writeText(`(function(){try{var n=performance.getEntriesByType('navigation')[0];
var u=n?n.name:document.URL;
if(u.includes(':~:text=')){
  var r=0,s=function(){
    var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
    if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
    else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
    else if(r++<50){setTimeout(s,200);}
  };s();
}}catch(e){}})();`);
                                      toast.success("Snippet copied to clipboard");
                                  }}
                                >
                                  Copy Snippet
                                </Button>
                            </div>
                        </div>

                        {/* Complete Example */}
                        <div className="space-y-3 pt-2">
                           <h3 className="font-bold text-base text-slate-700 ml-1">
                                Complete Example Reference:
                           </h3>
                           <div className="relative rounded-md bg-slate-50 border border-slate-200">
                               <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-600 font-mono">
{`<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
  
  // AI Overview Detection
  (function(){try{var n=performance.getEntriesByType('navigation')[0];
  var u=n?n.name:document.URL;
  if(u.includes(':~:text=')){
    var r=0,s=function(){
      var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
      if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
      else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
      else if(r++<50){setTimeout(s,200);}
    };s();
  }}catch(e){}})();
</script>`}
                               </pre>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="absolute right-2 top-2 h-7 px-2 text-xs bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                 onClick={() => {
                                     navigator.clipboard.writeText(`<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
  
  // AI Overview Detection
  (function(){try{var n=performance.getEntriesByType('navigation')[0];
  var u=n?n.name:document.URL;
  if(u.includes(':~:text=')){
    var r=0,s=function(){
      var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
      if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
      else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
      else if(r++<50){setTimeout(s,200);}
    };s();
  }}catch(e){}})();
</script>`);
                                     toast.success("Complete example copied");
                                 }}
                               >
                                 Copy Full Example
                               </Button>
                           </div>
                        </div>

                      </div>
                      
                      <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                          <h4 className="mb-2 font-semibold text-blue-900 flex items-center gap-2">
                              <span className="text-xs uppercase tracking-wider font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Validation</span>
                              How to verify?
                          </h4>
                          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-1">
                              <li>Open the browser console (F12)</li>
                              <li>Go to the <strong>Network</strong> tab</li>
                              <li>Filter for "collect" requests</li>
                              <li>Click an AI Overview link and ensure an event is fired</li>
                          </ul>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* SEARCH CONSOLE SECTION - Independent Integration */}
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Search Console Integration
                      </h3>
                    </div>

                    {!gscAccount ? (
                      // NOT CONNECTED STATE - Show connect button
                      <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                        <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-[13px] mb-4">
                          No Search Console account connected
                        </p>
                        <Button
                          onClick={handleConnectGscAccount}
                          className="bg-slate-900 hover:bg-black text-white h-11 rounded-xl font-bold text-[13px] shadow-lg"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Connect GSC Account
                        </Button>
                      </div>
                    ) : (
                      // CONNECTED STATE - Match GA Card Style
                      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden shadow-sm">
                        <div className="p-4 bg-white hover:bg-slate-50 transition-colors space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-base">
                                Search Console Account
                              </p>
                              <p className="text-[10px] font-semibold text-slate-500 tracking-tight">
                                {gscAccount.siteUrl
                                  ? `Active Property • ${gscAccount.siteUrl
                                      .replace("sc-domain:", "")
                                      .replace("https://", "")
                                      .replace("http://", "")}`
                                  : "No property selected"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Are you sure you want to disconnect Search Console?"
                                  )
                                ) {
                                  try {
                                    await api.delete(
                                      `/api/search-console-accounts?id=${gscAccount._id}`
                                    );

                                    // CLEAR ALL GSC DATA STATE IMMEDIATELY
                                    setGscAccount(null);
                                    setSearchConsoleData(null);
                                    setScChartData([]);
                                    setScTopQueries([]);
                                    setScSites([]);
                                    setGscProperties([]);

                                    toast.success(
                                      "Search Console disconnected"
                                    );
                                    loadGscAccount(); // Double check from server
                                  } catch (error) {
                                    toast.error("Failed to disconnect");
                                  }
                                }
                              }}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Property Selection Dropdown */}
                          <div className="pt-2">
                            <Select
                              value={gscAccount.siteUrl || ""}
                              onValueChange={(val) =>
                                handleGscPropertyChange(gscAccount._id, val)
                              }
                              onOpenChange={(isOpen) => {
                                if (isOpen && gscProperties.length === 0) {
                                  fetchGscProperties(gscAccount._id);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-9 text-xs bg-slate-100 border-slate-200">
                                <SelectValue placeholder="Select Property" />
                              </SelectTrigger>
                              <SelectContent>
                                {loadingGscProperties ? (
                                  <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    Loading properties...
                                  </div>
                                ) : gscProperties.length === 0 &&
                                  gscAccount.siteUrl ? (
                                  // Show currently selected property even if full list not loaded
                                  <SelectItem
                                    value={gscAccount.siteUrl}
                                    className="text-xs"
                                  >
                                    {gscAccount.siteUrl}
                                  </SelectItem>
                                ) : gscProperties.length === 0 ? (
                                  <div className="p-3 text-xs text-center text-muted-foreground">
                                    No verified properties found
                                  </div>
                                ) : (
                                  gscProperties.map((site: any) => (
                                    <SelectItem
                                      key={site.siteUrl}
                                      value={site.siteUrl}
                                      className="text-xs"
                                    >
                                      {site.siteUrl}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
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
              <div className="flex flex-row justify-between items-center ">
                <div className="flex items-center gap-2">
                  <Button
                    variant={
                      activeView === "ai-analytics" ? "default" : "outline"
                    }
                    className="rounded-full px-5 py-2 h-9 text-sm font-medium"
                    onClick={() => setActiveView("ai-analytics")}
                  >
                    AI Traffic Analytics
                  </Button>
                  <Button
                    variant={
                      activeView === "search-console" ? "default" : "outline"
                    }
                    className="rounded-full px-5 py-2 h-9 text-sm font-medium "
                    onClick={() => setActiveView("search-console")}
                  >
                    Search Analytics
                  </Button>
                </div>
                <div className="mr-3">
                  <RangeCalendar
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                  />
                </div>
              </div>

              {/* AI Analytics View */}
              {activeView === "ai-analytics" && (
                <>
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
                      <Card className=" bg-card  rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                          <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                            AI Overview Clicks
                          </h3>
                          <Users className="h-4 w-4 text-slate-400" />
                        </div>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-slate-900">
                            {(
                              keyMetrics.aiOverviewClicks ?? 0
                            ).toLocaleString()}
                          </div>
                          <p className="text-xs text-slate-600/80 mt-1">
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
                              Shows daily active user trends comparing total
                              website traffic with AI-referred traffic
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
                                labelFormatter={formatDate}
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">
                        AI Overview Performance
                      </h3>
                      <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • GTM tracked citations & features
                      </span>
                    </div>

                    <AiOverviewStats
                      pages={aiOverviewStats.pages}
                      devices={aiOverviewStats.devices}
                      loading={loading}
                    />
                  </div>

                  {/* 2. User Journey and Conversion */}
                  <div className="space-y-4">
                    {/* AI Audience Warning */}
                    {/* {missingAudience && (
                      <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader>
                          <CardTitle className="text-amber-900 text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            AI Traffic Audience Required
                          </CardTitle>
                          <CardDescription className="text-amber-800 text-xs">
                            The "AI Traffic" audience is being created in your Google Analytics property.
                            This may take a few minutes. Once created, first touch and zero touch attribution data will be available.
                            <br /><br />
                            <strong>Note:</strong> The audience needs to collect data for at least 24-48 hours before showing meaningful results.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )} */}

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
                                Tracks impressions and brand searches where
                                users don't directly click but are influenced by
                                brand awareness
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
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 0,
                                  bottom: 0,
                                }}
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
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "8px",
                                    boxShadow:
                                      "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    padding: "12px",
                                  }}
                                  cursor={{
                                    stroke: "#cbd5e1",
                                    strokeWidth: 1,
                                    strokeDasharray: "4 4",
                                  }}
                                  labelFormatter={formatDate}
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
                      <AIGrowthRateChart
                        data={aiGrowthData}
                        loading={loading}
                      />

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
                                Breakdown of user traffic distribution across
                                different AI models (ChatGPT, Copilot,
                                Perplexity, etc.)
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
                                Users from AI sources
                              </CardDescription>
                            </div>
                            <InfoTooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Bar chart showing the number of active users
                                coming from each AI model over the last 30 days
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
                                data={aiModelsData.filter(
                                  (item) => item.users > 0
                                )}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#e5e7eb"
                                />
                                <XAxis
                                  dataKey="model"
                                  tick={{ fontSize: 12 }}
                                />
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
                                Detailed performance metrics including active
                                users, sessions, and conversion rates for each
                                AI model
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
                                        <TableCell>
                                          {row.sessions || 0}
                                        </TableCell>
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
                              Shows the top landing pages and entry points for
                              users coming from AI sources with their traffic
                              distribution
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
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Rows:
                                </span>
                                <Select
                                  value={limit}
                                  onValueChange={(val) => setLimit(val)}
                                >
                                  <SelectTrigger className="w-[70px] h-8 text-xs">
                                    <SelectValue placeholder="10" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "border rounded-lg overflow-hidden",
                                parseInt(limit) > 10 &&
                                  "max-h-[500px] overflow-y-auto"
                              )}
                            >
                              <Table>
                                <TableHeader
                                  className={cn(
                                    "bg-purple-50",
                                    parseInt(limit) > 10 &&
                                      "sticky top-0 z-10 shadow-sm"
                                  )}
                                >
                                  <TableRow className="bg-purple-50 hover:bg-purple-50">
                                    <TableHead className="font-semibold">
                                      #
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      Landing Page
                                    </TableHead>
                                    <TableHead className="font-semibold">
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
                                                style={{
                                                  width: `${percentage}%`,
                                                }}
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
                </>
              )}

              {/* Search Console View */}
              {activeView === "search-console" && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Search Console Performance
                      </h3>
                      <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • Long-tail queries (4+ words)
                      </span>
                    </div>

                    {/* Search Console Setup or Data */}
                    {scLoading ? (
                      <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-center h-64">
                            <Loader className="h-8 w-8 animate-spin text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : !gscAccount ? (
                      // Not Connected State
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                          <Globe className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">
                          Connect Search Console
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md text-center mb-6">
                          Connect your Google Search Console account in the
                          settings panel to view organic search performance
                          data.
                        </p>
                        <Button onClick={() => setIsSettingsOpen(true)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Open Settings
                        </Button>
                      </div>
                    ) : !scChartData.length ? (
                      // Connected but No Data / Loading
                      <div className="flex flex-col items-center justify-center p-12 border border-slate-200 rounded-2xl bg-white">
                        <div className="bg-slate-50 p-3 rounded-xl mb-4">
                          <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">
                          No Data Available
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md text-center">
                          {gscAccount.siteUrl
                            ? "We couldn't find any search performance data for the selected property in this date range."
                            : "Please select a property in the settings panel to view your data."}
                        </p>
                      </div>
                    ) : scChartData.length > 0 ? (
                      <>
                        {/* Metrics Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Total Clicks
                              </h3>
                              <MousePointerClick className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold text-slate-900">
                                {searchConsoleData?.totals?.totalClicks?.toLocaleString() ||
                                  0}
                              </div>
                              <p className="text-xs text-slate-600/80 mt-1">
                                From long-tail queries
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Total Impressions
                              </h3>
                              <Users className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold text-slate-900">
                                {searchConsoleData?.totals?.totalImpressions?.toLocaleString() ||
                                  0}
                              </div>
                              <p className="text-xs text-slate-600/80 mt-1">
                                Times shown in search
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Average CTR
                              </h3>
                              <Zap className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold text-slate-900">
                                {(
                                  (searchConsoleData?.totals?.avgCtr || 0) * 100
                                ).toFixed(2)}
                                %
                              </div>
                              <p className="text-xs text-slate-600/80 mt-1">
                                Click-through rate
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex flex-row justify-between items-center shrink-0 bg-slate-50/50">
                              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                Average Position
                              </h3>
                              <ChartBar className="h-4 w-4 text-slate-400" />
                            </div>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold text-slate-900">
                                {(
                                  searchConsoleData?.totals?.avgPosition || 0
                                ).toFixed(1)}
                              </div>
                              <p className="text-xs text-slate-600/80 mt-1">
                                In search results
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Long-Tail Queries Chart */}
                        <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <CardHeader className="border-b border-slate-100 px-5 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                  Long-Tail Query Performance Over Time
                                </CardTitle>
                                <CardDescription className="text-[10px] text-slate-500 font-medium">
                                  Clicks and impressions for detailed search
                                  queries (4+ words)
                                </CardDescription>
                              </div>
                              <InfoTooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Shows search performance trends for queries
                                  with 4 or more words - typically more
                                  specific, high-intent searches
                                </TooltipContent>
                              </InfoTooltip>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={scChartData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#e5e7eb"
                                />
                                <XAxis
                                  dataKey="date"
                                  stroke="#6b7280"
                                  tick={{ fontSize: 12 }}
                                  tickFormatter={(date) => {
                                    const d = new Date(date);
                                    return d.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    });
                                  }}
                                />
                                <YAxis
                                  stroke="#6b7280"
                                  tick={{ fontSize: 12 }}
                                />
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
                                  dataKey="clicks"
                                  stroke="#3b82f6"
                                  strokeWidth={3}
                                  name="Clicks"
                                  dot={{ fill: "#3b82f6", r: 1 }}
                                  activeDot={{ r: 3 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="impressions"
                                  stroke="#8b5cf6"
                                  strokeWidth={3}
                                  name="Impressions"
                                  dot={{ fill: "#8b5cf6", r: 1 }}
                                  activeDot={{ r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Top Queries Table */}
                        {scTopQueries.length > 0 && (
                          <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 px-5 bg-slate-50/50">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                                    Top Long-Tail Queries
                                  </CardTitle>
                                  <CardDescription className="text-[10px] text-slate-500 font-medium">
                                    Search queries with 4+ words driving traffic
                                  </CardDescription>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Limit Selector */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                      Rows:
                                    </span>
                                    <Select
                                      value={scLimit}
                                      onValueChange={setScLimit}
                                    >
                                      <SelectTrigger className="h-7 w-[70px] text-xs font-semibold bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="50" />
                                      </SelectTrigger>
                                      <SelectContent align="end">
                                        <SelectItem
                                          value="25"
                                          className="text-xs"
                                        >
                                          25
                                        </SelectItem>
                                        <SelectItem
                                          value="50"
                                          className="text-xs"
                                        >
                                          50
                                        </SelectItem>
                                        <SelectItem
                                          value="100"
                                          className="text-xs"
                                        >
                                          100
                                        </SelectItem>
                                        <SelectItem
                                          value="250"
                                          className="text-xs"
                                        >
                                          250
                                        </SelectItem>
                                        <SelectItem
                                          value="500"
                                          className="text-xs"
                                        >
                                          500
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <InfoTooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Shows the most common long-tail search
                                      queries (4+ words) that bring users to
                                      your site
                                    </TooltipContent>
                                  </InfoTooltip>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                              {scLoading && (
                                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                </div>
                              )}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="font-semibold border-r border-slate-100 last:border-r-0 w-[50px]">
                                      #
                                    </TableHead>
                                    <TableHead className="font-semibold border-r border-slate-100 last:border-r-0">
                                      Query
                                    </TableHead>
                                    <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                      Clicks
                                    </TableHead>
                                    <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                      Impressions
                                    </TableHead>
                                    <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                      CTR
                                    </TableHead>
                                    <TableHead className="font-semibold text-right border-r border-slate-100 last:border-r-0 w-[100px]">
                                      Avg Position
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {scTopQueries.map(
                                    (query: any, index: number) => (
                                      <TableRow
                                        key={index}
                                        className="hover:bg-slate-50/50 transition-colors"
                                      >
                                        <TableCell className="font-medium text-gray-600 border-r border-slate-100 last:border-r-0">
                                          {index + 1}
                                        </TableCell>
                                        <TableCell className="max-w-md border-r border-slate-100 last:border-r-0">
                                          <span className="text-sm font-medium">
                                            {query.query}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-blue-600 border-r border-slate-100 last:border-r-0">
                                          {query.clicks.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                          {query.impressions.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                          <span
                                            className={`font-medium ${
                                              query.ctr > 0.05
                                                ? "text-green-600"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {(query.ctr * 100).toFixed(2)}%
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                          <span
                                            className={`font-medium ${
                                              query.position <= 10
                                                ? "text-green-600"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {query.position.toFixed(1)}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Globe className="h-12 w-12 mb-3 opacity-20" />
                            <p className="font-medium">
                              Search Console not available
                            </p>
                            <p className="text-sm mt-2">
                              Re-authenticate to grant Search Console
                              permissions
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

//  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                    <Card className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//                     <CardHeader className="border-b border-slate-100 px-5">
//                       <div className="flex items-center justify-between">
//                        <div>
//                           <CardTitle className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
//                             AI Overview Trends
//                           </CardTitle>
//                           <CardDescription className="text-[10px] text-slate-500 font-medium">
//                             Daily clicks from Google AI Overviews
//                           </CardDescription>
//                         </div>
//                         <InfoTooltip>
//                           <TooltipTrigger>
//                             <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-auto" />
//                           </TooltipTrigger>
//                           <TooltipContent>
//                             Tracks the daily volume of users landing on your site specifically via Google's "AI Overview" text fragments.
//                           </TooltipContent>
//                         </InfoTooltip>
//                       </div>
//                     </CardHeader>

//                     <CardContent className="pt-6">
//                       {loading ? (
//                         <div className="flex items-center justify-center h-[300px]">
//                           <Loader className="h-8 w-8 animate-spin text-slate-400" />
//                         </div>
//                       ) : (
//                         <ResponsiveContainer width="100%" height={300}>
//                           <LineChart data={chartData}>
//                             <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
//                             <XAxis
//                               dataKey="name"
//                               stroke="#9ca3af"
//                               tick={{ fontSize: 12 }}
//                               tickFormatter={formatDate}
//                             />
//                             <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} allowDecimals={false} />
//                             <Tooltip
//                               contentStyle={{
//                                 backgroundColor: "white",
//                                 border: "1px solid #e9d5ff",
//                                 borderRadius: "8px",
//                               }}
//                             />
//                             <Legend />
//                             <Line
//                               type="monotone"
//                               dataKey="aiOverview"
//                               stroke="#9333ea" /* Purple Color */
//                               strokeWidth={3}
//                               name="AI Overview Clicks"
//                               dot={{ fill: "#9333ea", r: 2 }}
//                               activeDot={{ r: 5 }}
//                             />
//                           </LineChart>
//                         </ResponsiveContainer>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>
