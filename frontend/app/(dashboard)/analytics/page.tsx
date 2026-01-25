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
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Loader2,
  Settings,
  Plus,
  Zap,
  Trash2,
  ChartBar,
  Globe,
  FileSpreadsheet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { SearchConsoleView } from "@/feature/analytics/view/SearchConsoleView";
import { AITrafficAnalyticsView } from "@/feature/analytics/view/AITrafficAnalyticsView";
import { AIOverviewView } from "@/feature/analytics/view/AIOverviewView";

import { cn } from "@/lib/utils";

import { RangeCalendar } from "@/components/RangeCalendar";


import { exportAnalyticsToExcel } from "@/lib/utils/excel-export";
import AiOverviewInstructionDialog from '@/feature/analytics/components/AiOverviewInstructionDialog';
import useAnalyticsData from "@/hooks/useAnalyticsData";
import { KeyMetrics } from '../../../hooks/useAnalyticsData';

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
              activeView === "ai-overview" ? "default" : "outline"
            }
            className="rounded-full px-5 py-2 h-9 text-sm font-medium"
            onClick={() => setActiveView("ai-overview")}
          >
            AI Overview
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
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />

            </div>
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
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
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
              {/* 1. Engagement and Quality Insights */}


              {/* AI Analytics View */}
              {activeView === "ai-analytics" && (
                <AITrafficAnalyticsView
                  loading={loading}
                  keyMetrics={keyMetrics}
                  chartData={chartData}
                  aiOverviewStats={aiOverviewStats}
                  firstTouchData={firstTouchData}
                  zeroTouchData={zeroTouchData}
                  conversionRateData={conversionRateData}
                  topicClusterData={topicClusterData}
                  aiGrowthData={aiGrowthData}
                  aiModelsData={aiModelsData}
                  aiLandingPageData={aiLandingPageData}
                  aiDeviceData={aiDeviceData}
                  demographicsData={demographicsData}
                  limit={limit}
                  setLimit={setLimit}
                  formatDate={formatDate}
                />
              )}

              {/* AI Overview View */}
              {activeView === "ai-overview" && (
                <AIOverviewView
                  aiOverviewStats={aiOverviewStats}
                  keymetrics={keyMetrics}
                  gaAccountId={selectedAccountId}
                  loading={loading}
                />
              )}

              {/* Search Console View */}
              {activeView === "search-console" && (
                <SearchConsoleView
                  scLoading={scLoading}
                  gscAccount={gscAccount}
                  scChartData={scChartData}
                  searchConsoleData={searchConsoleData}
                  scTopQueries={scTopQueries}
                  scLimit={scLimit}
                  setScLimit={setScLimit}
                  setIsSettingsOpen={setIsSettingsOpen}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
