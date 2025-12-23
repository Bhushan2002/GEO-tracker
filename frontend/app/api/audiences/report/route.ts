import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

// Initialize the Data API Client
const dataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL!,
    // Ensure the private key is correctly formatted for OpenSSL 3.0
    private_key: process.env.GA_PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
  },
});

export async function GET() {
  try {
    const propertyId = process.env.GA_PROPERTY_ID;

    // Execute the report request
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      // 'audienceName' is the key dimension to group data by your custom segments
      dimensions: [{ name: "audienceName" }],
      // Metrics used to analyze the value of AI traffic vs others
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "sessionConversionRate" },
        { name: "conversions" }
      ],
    });

    // Transform the raw API response into a clean format for your frontend Table
    const formattedRows = response.rows?.map((row) => ({
      audience: row.dimensionValues?.[0]?.value || "Unknown",
      users: row.metricValues?.[1]?.value || "0",
      sessions: row.metricValues?.[1]?.value || "0",
      // Convert conversion rate to a readable percentage
      conversionRate: `${(parseFloat(row.metricValues?.[2]?.value || "0") * 100).toFixed(2)}%`,
      conversions: row.metricValues?.[3]?.value || "0",
    }));

    return NextResponse.json(formattedRows || []);
  } catch (error: any) {
    console.error("Audience Report Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}