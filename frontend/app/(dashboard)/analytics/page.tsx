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
import CitationsPieChart from "@/components/Charts/CitationsPieChart";

import { AiOverviewStats } from "@/components/Charts/AiOverviewStats";
import { RangeCalendar } from "@/components/RangeCalendar";


import { exportAnalyticsToExcel } from "@/lib/utils/excel-export";
import AiOverviewInstructionDialog from '../../../components/AiOverviewInstructionDialog';
import WebTrafficChart from "@/components/Charts/WebTrafficChart";
import { ZeroTouchChart } from "@/components/Charts/ZeroTouchChart";
import FirstTouchChart from "@/components/Charts/FirstTouchChart";
import { TrafficByModel } from "@/components/Charts/TrafficByModel";
import AiModelPerformanceTable from "@/components/Charts/AiModelPerformanceTable";
import LandingPageTable from "@/components/Charts/LandingPageTable";
import useAnalyticsData from "@/hooks/useAnalyticsData";

/**
 * Analytics page integrating Google Analytics data.
 * Visualizes user engagement, AI model traffic, and conversion metrics.
 */
export default function GoogleAnalyticsPage() {
  const { activeWorkspace } = useWorkspace();

  // Use the custom hook for all analytics data management
  const {
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
    gscAccount,
    searchConsoleData,
    scLoading,
    scSites,
    scChartData,
    scTopQueries,
    scLimit,
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
    isSettingsOpen,
    setIsSettingsOpen,
    exporting,
    setExporting,
    activeSetupAccount,
    setActiveSetupAccount,
    showInstallInstructions,
    setShowInstallInstructions,
  } = useAnalyticsData();

  // Local state for additional UI
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [gscProperties, setGscPropertiesLocal] = useState<any[]>([]);
  const [loadingGscProperties, setLoadingGscProperties] = useState(false);

  // Handle OAuth callback - force refresh when account is connected
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const gscConnected = urlParams.get("gsc_connected");

    if (connected === "true" && activeWorkspace?._id) {
      window.history.replaceState({}, "", window.location.pathname);
      loadGAAccounts();
      loadGscAccount();
      toast.success("Google Analytics connected successfully!");
    }

    if (gscConnected === "true" && activeWorkspace?._id) {
      window.history.replaceState({}, "", window.location.pathname);
      loadGscAccount();
      toast.success("Search Console connected successfully!");
    }
  }, [activeWorkspace?._id, loadGAAccounts, loadGscAccount]);

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
  }, [setScSites]);

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

  // const handleGtmSetup = async (dbAccountId: string, measurementId: string) => {
  //   if (!selectedGtmContainer) return;

  //   // Find the full container object to get the internal gtmAccountId
  //   const container = gtmContainers.find(
  //     (c) => c.publicId === selectedGtmContainer
  //   );
  //   if (!container) return;

  //   try {
  //     const response = await api.post("/api/gtm/setup", {
  //       dbAccountId,
  //     });

  //     const result = response.data;

  //     // Show appropriate message based on status
  //     if (result.status === "Configured and Published") {
  //       toast.success(result.message || "Success! GTM tracking is now live!");

  //       // Show installation instructions
  //       setInstallationGtmId(container.publicId); // Use the public GTM ID (GTM-XXXXX)
  //       setShowInstallInstructions(true);
  //     } else {
  //       // Partial success - configured but not published
  //       toast.success(result.message || "GTM configured successfully!");
  //       if (result.warning) {
  //         setTimeout(() => {
  //           toast.warning(result.warning, { duration: 8000 });
  //         }, 500);
  //       }
  //     }

  //     setIsGtmDialogOpen(false);
  //   } catch (e: any) {
  //     console.error(e);
  //     const errorMsg =
  //       e.response?.data?.error || "Setup failed. Check console for details.";
  //     toast.error(errorMsg);
  //   }
  // };

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
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to remove account");
    }
  };


  // Handle property change for GA account
  const handlePropertyChange = async (
    accountId: string,
    propertyId: string,
    forceSwitch = false
  ) => {
    const properties = propertiesMap[accountId];
    const selectedProp = properties?.find((p: any) => p.id === propertyId);

    if (!selectedProp) return;

    try {
      await api.patch(`/api/ga-accounts/${accountId}`, {
        propertyId: selectedProp.id,
        propertyName: selectedProp.name,
        forceSwitch,
      });

      toast.success("Property updated successfully");

      // Update local state to reflect change immediately
      setGaAccounts((prev: any[]) =>
        prev.map((acc: any) => {
          if (acc._id === accountId) {
            return {
              ...acc,
              propertyId: selectedProp.id,
              propertyName: selectedProp.name,
              aiAudienceId: null,
              aiAudienceName: null,
            };
          }
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

      // If this is the currently selected account, reload data
      if (selectedAccountId === accountId) {
        await loadAccountData(accountId);
      }
    } catch (error: any) {
      console.error("Failed to update property", error);

      if (
        error.response?.status === 409 &&
        error.response?.data?.canForceSwitch
      ) {
        const conflictingAccount = error.response.data.conflictingAccountName;
        const confirmed = confirm(
          `This property is currently connected to "${conflictingAccount}".\n\n` +
          `Would you like to switch it to this account? This will disconnect it from "${conflictingAccount}".`
        );

        if (confirmed) {
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


  // Fetch GSC properties for property selection
  const fetchGscProperties = useCallback(async (accountId: string) => {
    setLoadingGscProperties(true);
    try {
      const res = await api.get(
        `/api/search-console/sites?accountId=${accountId}`
      );
      const sites = res.data.sites || [];
      const message = res.data.message;

      setGscPropertiesLocal(sites);

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

  // Auto-fetch GSC properties if account connected but no site selected
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
                  <AiOverviewInstructionDialog showInstallInstructions={showInstallInstructions} setShowInstallInstructions={setShowInstallInstructions} />

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
                    <WebTrafficChart loading={loading} chartData={chartData} formatDate={formatDate} />

                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">
                        AI Overview Performance
                      </h3>
                      <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        • AI Overview event data
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
                      <FirstTouchChart
                        data={firstTouchData}
                        loading={loading}
                        formatDate={formatDate}
                      />
                      {/* Zero touch chart */}
                      <ZeroTouchChart
                        data={zeroTouchData}
                        loading={loading}
                        formatDate={formatDate}
                      />

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

                      {/* Traffic by AI Modeles Bar */}
                      <TrafficByModel loading={loading} aiModelsData={aiModelsData} />

                      {/* AI Model Performance Table */}
                      <AiModelPerformanceTable
                        loading={loading}
                        aiModelsData={aiModelsData}
                      />
                    </div>

                    {/* Landing Pages table*/}

                    <LandingPageTable
                      loading={loading}
                      aiLandingPageData={aiLandingPageData}
                      limit={limit}
                      setLimit={setLimit}
                    />

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
                                            className={`font-medium ${query.ctr > 0.05
                                              ? "text-green-600"
                                              : "text-gray-600"
                                              }`}
                                          >
                                            {(query.ctr * 100).toFixed(2)}%
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right border-r border-slate-100 last:border-r-0">
                                          <span
                                            className={`font-medium ${query.position <= 10
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
