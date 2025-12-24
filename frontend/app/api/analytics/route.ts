import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if environment variables exist
    if (!process.env.GA_CLIENT_EMAIL) {
      console.error("GA_CLIENT_EMAIL is not set");
      return NextResponse.json(
        { error: "GA_CLIENT_EMAIL environment variable is missing" },
        { status: 503 }
      );
    }

    if (!process.env.GA_PRIVATE_KEY) {
      console.error("GA_PRIVATE_KEY is not set");
      return NextResponse.json(
        { error: "GA_PRIVATE_KEY environment variable is missing" },
        { status: 503 }
      );
    }

    if (!process.env.GA_PROPERTY_ID) {
      console.error("GA_PROPERTY_ID is not set");
      return NextResponse.json(
        { error: "GA_PROPERTY_ID environment variable is missing" },
        { status: 503 }
      );
    }

    // Validate credentials format
    if (!process.env.GA_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      console.error("GA_PRIVATE_KEY appears to be invalid - missing BEGIN PRIVATE KEY");
      return NextResponse.json(
        { error: "GA_PRIVATE_KEY is not properly formatted" },
        { status: 503 }
      );
    }
    
    // Properly format the private key
    let privateKey = process.env.GA_PRIVATE_KEY;
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
      
    const analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: privateKey,
      },
    });

    // Fetch time series data for chart
    const [timeSeriesResponse] = await analyticsClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
    });

    const chartData = timeSeriesResponse.rows?.map((row) => ({
      name: row.dimensionValues?.[0].value,
      users: parseInt(row.metricValues?.[0].value || "0"),
    }));

    // Fetch overall metrics for the same period
    const [metricsResponse] = await analyticsClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "engagedSessions" },
        { name: "eventCount" }
      ],
    });

    const metrics = {
      activeUsers: parseInt(metricsResponse.rows?.[0]?.metricValues?.[0]?.value || "0"),
      engagedSessions: parseInt(metricsResponse.rows?.[0]?.metricValues?.[1]?.value || "0"),
      keyEvents: parseInt(metricsResponse.rows?.[0]?.metricValues?.[2]?.value || "0"),
    };

    return NextResponse.json({ 
      chartData: chartData || [],
      metrics 
    });
  } catch (error: any) {
    console.error("Analytics API error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Return a more informative error response
    return NextResponse.json({ 
      error: error.message || "Failed to fetch analytics data",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
