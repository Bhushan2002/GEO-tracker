import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if credentials are properly configured
    const hasValidCredentials = 
      process.env.GA_CLIENT_EMAIL && 
      process.env.GA_PRIVATE_KEY && 
      process.env.GA_PROPERTY_ID &&
      !process.env.GA_CLIENT_EMAIL.includes('your_') &&
      !process.env.GA_PROPERTY_ID.includes('your_') &&
      process.env.GA_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');
    
    if (!hasValidCredentials) {
      return NextResponse.json(
        { error: "Google Analytics credentials are not properly configured" },
        { status: 503 }
      );
    }
    
    // Properly format the private key
    let privateKey = process.env.GA_PRIVATE_KEY!;
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
      
    const analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: privateKey,
      },
    });

    const [response] = await analyticsClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
    });

    const chartData = response.rows?.map((row) => ({
      name: row.dimensionValues?.[0].value,
      users: parseInt(row.metricValues?.[0].value || "0"),
    }));

    return NextResponse.json(chartData || []);
  } catch (error: any) {
    console.error("Analytics API error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
