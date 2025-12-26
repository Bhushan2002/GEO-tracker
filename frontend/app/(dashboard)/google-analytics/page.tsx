"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { analyticsAPI } from "@/api/analytics.api";
import { accountsAPI } from "@/api/accounts.api";
import { AITrafficBarChart } from '../../../components/AITrafficBarChart';
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


interface Audience {
  name: string;
  displayName: string;
  description: string;
  membershipDurationDays: number;
  createdAt: { seconds: string; nanos: number } | string;
}

interface Property {
  name: string;
  displayName: string;
  propertyType: string;
  createTime: string;
  timeZone: string;
  currencyCode: string;
  propertyId: string;
}

interface Account {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
  regionCode: string;
  deleted: boolean;
  properties: Property[];
}

export default function page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audienceReportData, setAudienceReportData] = useState<any[]>([]);
  const [audienceTimeseriesData, setAudienceTimeseriesData] = useState<any[]>(
    []
  );
  const [audienceNames, setAudienceNames] = useState<string[]>([]);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [aiModelsData, setAiModelsData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [keyMetrics, setKeyMetrics] = useState({
    activeUsers: 0,
    engagedSessions: 0,
    keyEvents: 0,
  });
  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
    membershipDurationDays: 30,
    dimensionName: "firstUserSource",
    matchType: "EXACT",
    value: "chatgpt.com",
  });

  useEffect(() => {
    // Check for connection status from both cookie and localStorage
    const cookieConnected = document.cookie
      .split("; ")
      .find((row) => row.startsWith("ga_connected="))
      ?.split("=")[1];
    const localStorageStatus = localStorage.getItem("gaConnected");

    console.log(
      "Connection check - Cookie:",
      cookieConnected,
      "LocalStorage:",
      localStorageStatus
    );

    // Sync cookie to localStorage if cookie exists
    if (cookieConnected === "true") {
      localStorage.setItem("gaConnected", "true");
      setIsConnected(true);

      console.log("Loading data after OAuth...");
      // Load data after successful OAuth
      loadAccounts();
      loadAudiences();
      loadAudienceReport();
      loadAudienceTimeseries();
      loadAiModelsReport();

      // Clear the cookie after syncing
      document.cookie =
        "ga_connected=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      toast.success("Successfully connected to Google Analytics!");
    } else if (localStorageStatus === "true") {
      setIsConnected(true);
      console.log("Loading data from existing connection...");
      loadAccounts();
      loadAudiences();
      loadAudienceReport();
      loadAudienceTimeseries();
      loadAiModelsReport();
    }

    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      if (error === "no_code") {
        toast.error("OAuth failed: No authorization code received");
      } else if (error === "setup_failed") {
        toast.error("Failed to set up Google Analytics connection");
      }
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
      localStorage.setItem("gaConnected", "false");
      setAccounts([]);
      setAudiences([]);
      setAudienceReportData([]);
      setAudienceTimeseriesData([]);
      toast.info("Google Analytics disconnected");
      return;
    }

    // Start OAuth flow
    const client_id = process.env.NEXT_PUBLIC_GA_CLIENT_ID;
    const redirect_uri = `${window.location.origin}/api/auth/callback/google`;
    const scope = [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
    ].join(" ");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    toast.info("Redirecting to Google sign-in...");
    window.location.href = authUrl;
  };

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const res = await accountsAPI.listAccounts();
      console.log("Accounts loaded:", res.data);
      setAccounts(res.data);
    } catch (error: any) {
      console.error("Failed to load accounts:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please reconnect.");
        setIsConnected(false);
        localStorage.setItem("gaConnected", "false");
      } else {
        toast.error("Failed to load accounts.");
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadAudiences = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.listAudiences();
      console.log("Audiences loaded:", res.data);
      setAudiences(res.data);
    } catch (error) {
      console.error("Failed to load audiences:", error);
      toast.error("Failed to load audiences.");
    } finally {
      setLoading(false);
    }
  };

  const loadAudienceReport = async () => {
    try {
      const res = await analyticsAPI.getAudienceReport();
      console.log("Audience report loaded:", res.data);
      setAudienceReportData(res.data);
    } catch (error) {
      console.error("Failed to load audience report:", error);
    }
  };

  const loadAudienceTimeseries = async () => {
    try {
      const res = await analyticsAPI.getAudienceTimeseries();
      console.log("Audience timeseries loaded:", res.data);
      setAudienceTimeseriesData(res.data.chartData || []);
      setAudienceNames(res.data.audiences || []);
      
      // Transform timeseries data into cohort format
      if (res.data.chartData && res.data.audiences) {
        transformToCohortData(res.data.chartData, res.data.audiences);
      }
    } catch (error) {
      console.error("Failed to load audience timeseries:", error);
    }
  };

  const transformToCohortData = (timeseriesData: any[], audiences: string[]) => {
    const colors: { [key: string]: string } = {
      "Any Touch AI": "#1e40af",
      "Zero Touch AI": "#9333ea",
      "AI Tools": "#059669",
      "ChatGPT": "#dc2626",
      "Claude": "#f59e0b",
    };

    const cohortsByAudience: { [key: string]: any } = {};

    // Group data by audience
    audiences.forEach((audience) => {
      const audienceData = timeseriesData.filter(
        (row: any) => row[audience] !== undefined
      );

      if (audienceData.length > 0) {
        // Sort by date to find first appearance
        const sortedDates = audienceData
          .map((row: any) => row.date)
          .sort();

        // Group into cohorts by week
        const cohortMap: { [key: string]: any[] } = {};
        
        audienceData.forEach((row: any) => {
          const dateObj = new Date(row.date);
          const weekStart = new Date(dateObj);
          weekStart.setDate(dateObj.getDate() - dateObj.getDay());
          const weekKey = weekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          if (!cohortMap[weekKey]) {
            cohortMap[weekKey] = [];
          }
          cohortMap[weekKey].push(row);
        });

        // Calculate retention percentages
        const cohorts = Object.entries(cohortMap).map(([weekKey, rows]: [string, any[]]) => {
          const firstWeekUsers = rows[0][audience] || 0;
          const weekPercentages = rows.map((row) => {
            const percentage = firstWeekUsers > 0 
              ? ((row[audience] || 0) / firstWeekUsers) * 100 
              : 0;
            return Math.round(percentage * 10) / 10; // Round to 1 decimal
          });

          return {
            dateRange: weekKey,
            users: Math.round(firstWeekUsers),
            weekPercentages,
          };
        });

        cohortsByAudience[audience] = {
          name: audience.toLowerCase().replace(/\s+/g, "-"),
          label: audience,
          color: colors[audience] || "#6366f1",
          activeUsers: Math.round(
            (audienceData[audienceData.length - 1]?.[audience] || 0) * 10
          ) / 10,
          weeks: [],
          cohorts: cohorts.slice(0, 5), // Limit to 5 cohorts
        };
      }
    });

    const cohortDataArray = Object.values(cohortsByAudience);
    console.log("Transformed cohort data:", cohortDataArray);
    setCohortData(cohortDataArray);
  };

  const loadAiModelsReport = async () => {
    try {
      const res = await analyticsAPI.getAiModelsReport();
      console.log("AI models report loaded:", res.data);
      setAiModelsData(res.data);
    } catch (error) {
      console.error("Failed to load AI models report:", error);
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "";

    const dateStr = String(dateValue);

    if (dateStr.length !== 8) return dateStr;

    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);

    const date = new Date(`${year}-${month}-${day}`);

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const result = await res.json();

        if (result.chartData && result.metrics) {
          setData(result.chartData);
          setKeyMetrics(result.metrics);
        } else {
          const formatted = result.map((d: any) => ({
            name: d.name,
            users: d.users,
          }));
          setData(formatted);

          const totalUsers = formatted.reduce(
            (sum: number, item: any) => sum + item.users,
            0
          );
          setKeyMetrics({
            activeUsers: totalUsers,
            engagedSessions: 0,
            keyEvents: 0,
          });
        }
      } catch (e) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="bg-white border-b rounded-2xl border-gray-200 sticky top-0 mt-3  z-10">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Google Analytics Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your brand performance and AI insights
        </p>
      </div>
    </div>
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Google Analytics Connection</CardTitle>
              <CardDescription>
                {isConnected
                  ? "Connected and tracking analytics data"
                  : "Connect to start tracking analytics"}
              </CardDescription>
            </div>
            <Button
              onClick={toggleConnection}
              variant={isConnected ? "destructive" : "default"}
              className={isConnected ? "" : "bg-green-600 hover:bg-green-700"}
            >
              {isConnected ? "Disconnect" : "Connect Google Analytics"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Google Analytics Accounts Table - Only show when connected */}
      {isConnected && (
        <>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Google Analytics Accounts</h2>
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts & Properties</CardTitle>
                <CardDescription>
                  All Google Analytics accounts and properties you have access to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <p>Loading accounts...</p>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No accounts found
                  </div>
                ) : (
                  <div className="space-y-6">
                    {accounts.map((account, accountIndex) => (
                      <div key={account.name} className="border rounded-lg p-4">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {account.displayName}
                            {account.deleted && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Deleted
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Account ID: {account.name?.split('/')[1]} • Region: {account.regionCode}
                          </p>
                        </div>

                        {account.properties.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property Name</TableHead>
                                <TableHead>Property ID</TableHead>

                                <TableHead>Time Zone</TableHead>
                                <TableHead>Currency</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {account.properties.map((property, propIndex) => (
                                <TableRow key={property.name}>
                                  <TableCell className="font-medium">
                                    {property.displayName}
                                  </TableCell>
                                  <TableCell>{property.propertyId}</TableCell>
                              
                                  <TableCell className="text-sm text-gray-600">
                                    {property.timeZone}
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">
                                    {property.currencyCode}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No properties found in this account
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
    
      {/* Website Traffic Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Website Traffic</h2>

        {/* Line Chart */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p>Loading analytics...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#1e40af"
                    strokeWidth={2}
                    dot={{ fill: "#1e40af", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
          <AITrafficBarChart />


          {/* Total users by Audience name over time */}
          {audienceTimeseriesData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Total users by Audience name over time</CardTitle>
                <CardDescription>
                  Compare audience engagement trends over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={audienceTimeseriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
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
                    {audienceNames.map((audience, index) => {
                      const colors = [
                        "#1e40af",
                        "#059669",
                        "#dc2626",
                        "#f59e0b",
                        "#8b5cf6",
                        "#ec4899",
                      ];
                      return (
                        <Line
                          key={audience}
                          type="monotone"
                          dataKey={audience}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          name={audience}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Audience Analytics Graphs */}
          {audienceReportData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

              <Card>
                <CardHeader>
                  <CardTitle>Conversions by Audience</CardTitle>
                  <CardDescription>
                    Track conversion performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={audienceReportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="audience"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="conversions"
                        fill="#f59e0b"
                        name="Conversions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Metrics Table</CardTitle>
                  <CardDescription>
                    Detailed audience performance data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Audience</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Conv. Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audienceReportData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {row.audience}
                          </TableCell>
                          <TableCell>{row.users}</TableCell>
                          <TableCell>{row.sessions}</TableCell>
                          <TableCell>{row.conversionRate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Models Traffic Section */}
          {aiModelsData.length > 0 && (
            <div className="space-y-4 mt-8">
              <h2 className="text-2xl font-bold">AI Models Traffic Breakdown</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Users by AI Model</CardTitle>
                    <CardDescription>
                      Distribution of traffic from different AI sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={aiModelsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="model"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="users" fill="#1e40af" name="Active Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Model Distribution</CardTitle>
                    <CardDescription>
                      Traffic share by model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={aiModelsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ model, value }) => `${model}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="users"
                        >
                          {aiModelsData.map((entry: any, index: number) => {
                            const colors = [
                              "#1e40af",
                              "#059669",
                              "#dc2626",
                              "#f59e0b",
                              "#8b5cf6",
                              "#ec4899",
                              "#06b6d4",
                              "#ef4444",
                            ];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Models Performance Table</CardTitle>
                  <CardDescription>
                    Detailed metrics for each AI model
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>AI Model</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Active Users</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Conversion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiModelsData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.model}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {row.source}
                          </TableCell>
                          <TableCell>{row.users}</TableCell>
                          <TableCell>{row.sessions}</TableCell>
                          <TableCell>{row.conversionRate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
