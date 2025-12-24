"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { analyticsAPI } from "@/api/analytics.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";




interface Audience {
  name: string;
  displayName: string;
  description: string;
  membershipDurationDays: number;
  createdAt: { seconds: string; nanos: number } | string;
}


export default function page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audienceReportData, setAudienceReportData] = useState<any[]>([]);
  const [audienceTimeseriesData, setAudienceTimeseriesData] = useState<any[]>([]);
  const [audienceNames, setAudienceNames] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyMetrics, setKeyMetrics] = useState({
    activeUsers: 0,
    engagedSessions: 0,
    keyEvents: 0
  });
  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
    membershipDurationDays: 30,
    dimensionName: "firstUserSource",
    matchType: "EXACT",
    value: "chatgpt.com"
  });

  useEffect(() => {
    // Check connection status from localStorage
    const connectionStatus = localStorage.getItem("gaConnected");
    setIsConnected(connectionStatus === "true");
    
    if (connectionStatus === "true") {
      loadAudiences();
      loadAudienceReport();
      loadAudienceTimeseries();
    }
  }, []);

  const toggleConnection = () => {
    const newStatus = !isConnected;
    setIsConnected(newStatus);
    localStorage.setItem("gaConnected", newStatus.toString());
    
    if (newStatus) {
      toast.success("Google Analytics connected!");
      loadAudiences();
      loadAudienceReport();
      loadAudienceTimeseries();
    } else {
      toast.info("Google Analytics disconnected");
      setAudiences([]);
      setAudienceReportData([]);
      setAudienceTimeseriesData([]);
    }
  };

  const loadAudiences = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.listAudiences();
      setAudiences(res.data);
    } catch (error) {
      toast.error("Failed to load audiences.");
    } finally {
      setLoading(false);
    }
  };

  const loadAudienceReport = async () => {
    try {
      const res = await analyticsAPI.getAudienceReport();
      setAudienceReportData(res.data);
    } catch (error) {
      console.error("Failed to load audience report:", error);
    }
  };

  const loadAudienceTimeseries = async () => {
    try {
      const res = await analyticsAPI.getAudienceTimeseries();
      setAudienceTimeseriesData(res.data.chartData || []);
      setAudienceNames(res.data.audiences || []);
    } catch (error) {
      console.error("Failed to load audience timeseries:", error);
    }
  };

  // Calculate AI Touch vs Zero Touch AI data
  // const getAiTouchData = () => {
  //   if (!audienceReportData || audienceReportData.length === 0) return [];
    

  //   const aiKeywords = ['ai', 'chatgpt', 'gpt', 'claude', 'gemini', 'copilot', 'bard', 'perplexity'];
    
  //   let aiTouchUsers = 0;
  //   let zeroTouchUsers = 0;
    
  //   audienceReportData.forEach((row) => {
  //     const audienceName = (row.audience || '').toLowerCase();
  //     const users = parseInt(row.users || '0');


  //     const isAiAudience = aiKeywords.some(keyword => audienceName.includes(keyword));
      
  //     if (isAiAudience) {
  //       aiTouchUsers += users;
  //     } else {
  //       zeroTouchUsers += users;
  //     }
  //   });
    
  //   return [
  //     { name: 'Any Touch AI', value: aiTouchUsers, fill: '#8b5cf6' },
  //     { name: 'Zero Touch AI', value: zeroTouchUsers, fill: '#6b7280' }
  //   ];
  // };

  

  


const formatDate = (dateValue: any) => {
  // 1. Safety check: if value is null/undefined, return empty string
  if (!dateValue) return "";

  // 2. Convert to string in case it's a Number
  const dateStr = String(dateValue);

  // 3. Ensure the string is in the expected GA format (YYYYMMDD = 8 characters)
  if (dateStr.length !== 8) return dateStr;

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  
  // Returns "Dec 24"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const result = await res.json();
        
        // Check if we have the new format with chartData and metrics
        if (result.chartData && result.metrics) {
          setData(result.chartData);
          setKeyMetrics(result.metrics);
        } else {
          // Fallback for old format (backwards compatibility)
          const formatted = result.map((d: any) => ({
            name: d.name,
            users: d.users,
          }));
          setData(formatted);
          
          // Calculate fallback metrics if needed
          const totalUsers = formatted.reduce((sum: number, item: any) => sum + item.users, 0);
          setKeyMetrics({
            activeUsers: totalUsers,
            engagedSessions: 0,
            keyEvents: 0
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
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Google Analytics Connection</CardTitle>
              <CardDescription>
                {isConnected ? "Connected and tracking analytics data" : "Connect to start tracking analytics"}
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
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#1e40af" 
                    strokeWidth={2}
                    dot={{ fill: '#1e40af', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audience Intelligence Section - Only show when connected */}
      {isConnected && (
        <>
          <h1 className="text-2xl font-bold mt-8">Audience Intelligence</h1>

          {/* Total users by Audience name over time */}
          {audienceTimeseriesData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Total users by Audience name over time</CardTitle>
                <CardDescription>Compare audience engagement trends over the last 30 days</CardDescription>
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
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    {audienceNames.map((audience, index) => {
                      const colors = ['#1e40af', '#059669', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899'];
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
              {/* AI Touch vs Zero Touch AI */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>AI Touch Analysis</CardTitle>
                  <CardDescription>Users who came through AI vs non-AI sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getAiTouchData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {getAiTouchData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card> */}

              {/* <Card>
                <CardHeader>
                  <CardTitle>Active Users by Audience</CardTitle>
                  <CardDescription>Compare user engagement across audiences</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={audienceReportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="audience" angle={-45} textAnchor="end" height={100} />
                      <YAxis  />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#3b82f6" name="Active Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessions by Audience</CardTitle>
                  <CardDescription>Session counts across different audiences</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={audienceReportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="audience" angle={-45} textAnchor="end" height={100} tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>*/}
              
              <Card>
                <CardHeader>
                  <CardTitle>Conversions by Audience</CardTitle>
                  <CardDescription>Track conversion performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={audienceReportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="audience" angle={-45} textAnchor="end" height={100} tickFormatter={formatDate}  />
                      <YAxis  />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversions" fill="#f59e0b" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card> 

              <Card>
                <CardHeader>
                  <CardTitle>Audience Metrics Table</CardTitle>
                  <CardDescription>Detailed audience performance data</CardDescription>
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
                          <TableCell className="font-medium">{row.audience}</TableCell>
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