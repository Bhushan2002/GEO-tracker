"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Trash2 } from "lucide-react";

interface GAAccountType {
  _id: string;
  accountName: string;
  accountId: string;
  propertyId: string;
  propertyName: string;
  createdAt: string;
}

export default function GoogleAnalyticsPage() {
  const [gaAccounts, setGaAccounts] = useState<GAAccountType[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [aiModelsData, setAiModelsData] = useState<any[]>([]);
  const [firstTouchData, setFirstTouchData] = useState<any[]>([]);
  const [zeroTouchData, setZeroTouchData] = useState<any[]>([]);
  const [keyMetrics, setKeyMetrics] = useState({
    activeUsers: 0,
    engagedSessions: 0,
    keyEvents: 0,
  });
  const [attributionData, setAttributionData] = useState([
    { segment: "First Touch AI", users: 0, convRate: 0 },
    { segment: "Zero Touch AI", users: 0, convRate: 0 },
  ]);
  useEffect(() => {
    loadGAAccounts();
    checkForNewConnection();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadAccountData(selectedAccountId);
    }
  }, [selectedAccountId]);

  const checkForNewConnection = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");

    if (connected === "true") {
      toast.success("Google Analytics account connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      // Reload accounts list
      setTimeout(() => loadGAAccounts(), 1000);
    }

    const error = urlParams.get("error");
    if (error) {
      toast.error(`Connection failed: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const loadGAAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ga-accounts");
      const accounts = await response.json();

      setGaAccounts(accounts);

      // Auto-select first account if available
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0]._id);
      }
      const attributionRes = await fetch(
        `/api/audiences/report?accountId=${accounts[0]._id}`
      );
      const attribution = await attributionRes.json();
      setAttributionData(attribution);
    } catch (error) {
      console.error("Failed to load GA accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const loadAccountData = async (accountId: string) => {
    try {
      setLoading(true);

      // Fetch analytics data
      const analyticsRes = await fetch(
        `/api/analytics-by-account?accountId=${accountId}`
      );
      const analyticsData = await analyticsRes.json();

      if (analyticsData.chartData) {
        setChartData(analyticsData.chartData);
        setKeyMetrics(analyticsData.metrics);
      }

      // Fetch AI models data
      const aiModelsRes = await fetch(
        `/api/ai-models-by-account?accountId=${accountId}`
      );
      const aiModels = await aiModelsRes.json();

      // Filter for specific models and ensure all models are present
      const allowedModels = ["ChatGPT", "Copilot", "Perplexity", "Gemini", "Claude"];
      const filteredAiModels = allowedModels.map(modelName => {
        const existingData = aiModels.find((item: any) => item.model === modelName);
        return existingData || {
          model: modelName,
          users: 0,
          sessions: 0,
          conversionRate: "0%"
        };
      });
      setAiModelsData(filteredAiModels);

      // Fetch First Touch data
      try {
        const firstTouchRes = await fetch(
          `/api/analytics/first-touch?accountId=${accountId}`
        );
        const firstTouch = await firstTouchRes.json();
        setFirstTouchData(firstTouch);
      } catch (err) {
        console.error("Failed to load first touch data:", err);
      }

      // Fetch Zero Touch data
      try {
        const zeroTouchRes = await fetch(
          `/api/analytics/zero-touch?accountId=${accountId}`
        );
        const zeroTouch = await zeroTouchRes.json();
        setZeroTouchData(zeroTouch);
      } catch (err) {
        console.error("Failed to load zero touch data:", err);
      }
    } catch (error) {
      console.error("Failed to load account data:", error);
      toast.error("Failed to load analytics data");
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
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    toast.info("Redirecting to Google sign-in...");
    window.location.href = authUrl;
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this account?")) return;

    try {
      await fetch(`/api/ga-accounts?id=${accountId}`, { method: "DELETE" });
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

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "";
    const dateStr = String(dateValue);
    if (dateStr.length !== 8) return dateStr;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    // Use local date constructor to avoid timezone issues
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Google Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your brand performance and AI insights across multiple
            accounts
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Connected Accounts Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Connected Google Analytics Accounts</CardTitle>
                <CardDescription>
                  Manage multiple GA4 properties and view their analytics
                </CardDescription>
              </div>
              <Button
                onClick={handleConnectAccount}
                className="bg-green-600 hover:bg-green-700"
              >
                + Add Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && gaAccounts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p>Loading accounts...</p>
              </div>
            ) : gaAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No accounts connected yet</p>
                <p className="text-sm mt-2">
                  Click "Add Account" to connect your first Google Analytics
                  account
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Property Name</TableHead>
                    <TableHead>Property ID</TableHead>
                    <TableHead>Connected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gaAccounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell className="font-medium">
                        {account.accountName}
                      </TableCell>
                      <TableCell>{account.propertyName}</TableCell>
                      <TableCell>{account.propertyId}</TableCell>
                      <TableCell>
                        {new Date(account.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Account Selector */}
        {gaAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Account to View Analytics</CardTitle>
              <CardDescription>
                Choose which Google Analytics property to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {gaAccounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.propertyName} ({account.propertyId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Analytics Charts - Only show when account is selected */}
        {selectedAccountId && (
          <>
            {/* Website Traffic Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Website Traffic</CardTitle>
                <CardDescription>
                  Daily active users over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading analytics...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
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
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#1e40af"
                        strokeWidth={2}
                        name="Total Users"
                        dot={{ fill: "#1e40af", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="aiUsers"
                        stroke="#059669"
                        strokeWidth={2}
                        name="AI Traffic"
                        dot={{ fill: "#059669", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* AI Models Traffic */}
            {aiModelsData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic by AI Model</CardTitle>
                    <CardDescription>
                      Users from AI sources (Last 30 Days)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={aiModelsData.filter(item => item.users > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="users" fill="#1e40af" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Model Distribution</CardTitle>
                    <CardDescription>Traffic share by model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={aiModelsData.filter(item => item.users > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ model, users }) => `${model}: ${users}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="users"
                        >
                          {aiModelsData.filter(item => item.users > 0).map((entry: any, index: number) => {
                            const colors = ["#1e40af", "#059669", "#dc2626", "#8b5cf6", "#f59e0b"];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Models Performance Table */}
            {aiModelsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Models Performance</CardTitle>
                  <CardDescription>
                    Detailed metrics for each AI model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>AI Model</TableHead>
                        <TableHead>Active Users</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Conversion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiModelsData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {row.model}
                          </TableCell>
                          <TableCell>{row.users || 0}</TableCell>
                          <TableCell>{row.sessions || 0}</TableCell>
                          <TableCell>{row.conversionRate || "0%"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* First Touch & Zero Touch Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Touch Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>First Touch Attribution</CardTitle>
                  <CardDescription>
                    Initial user interactions over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {firstTouchData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={firstTouchData}>
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
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="#059669"
                          strokeWidth={2}
                          name="First Touch Users"
                          dot={{ fill: "#059669", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="conversions"
                          stroke="#dc2626"
                          strokeWidth={2}
                          name="Conversions"
                          dot={{ fill: "#dc2626", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No first touch data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Zero Touch Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Zero Touch Attribution</CardTitle>
                  <CardDescription>
                    Indirect influence and brand awareness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {zeroTouchData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={zeroTouchData}>
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
                        <Line
                          type="monotone"
                          dataKey="impressions"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          name="Impressions"
                          dot={{ fill: "#8b5cf6", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="brandSearches"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Brand Searches"
                          dot={{ fill: "#f59e0b", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No zero touch data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
            </div>
          </>
        )}
      </div>
    </div>
  );
}
