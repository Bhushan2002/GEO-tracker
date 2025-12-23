import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if credentials are properly configured (not placeholders)
    const hasValidCredentials = 
      process.env.GA_CLIENT_EMAIL && 
      process.env.GA_PRIVATE_KEY && 
      process.env.GA_PROPERTY_ID &&
      !process.env.GA_CLIENT_EMAIL.includes('your_') &&
      !process.env.GA_PROPERTY_ID.includes('your_') &&
      process.env.GA_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');

    if (!hasValidCredentials) {
      // Return mock data for development/testing
      const mockData = [
        { name: "2024-12-17", users: 45 },
        { name: "2024-12-18", users: 62 },
        { name: "2024-12-19", users: 78 },
        { name: "2024-12-20", users: 93 },
        { name: "2024-12-21", users: 67 },
        { name: "2024-12-22", users: 81 },
        { name: "2024-12-23", users: 54 },
      ];
      return NextResponse.json(mockData);
    }

    // Configure client with credentials
    const analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
    });

    const [response] = await analyticsClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
    });

    // Format data for the chart
    const chartData = response.rows?.map((row) => ({
      name: row.dimensionValues?.[0].value, // Date
      users: parseInt(row.metricValues?.[0].value || "0"),
    }));

    return NextResponse.json(chartData || []);
  } catch (error: any) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}