import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.GA_CLIENT_EMAIL || !process.env.GA_PRIVATE_KEY || !process.env.GA_PROPERTY_ID) {
      console.error("Missing Google Analytics environment variables");
      return NextResponse.json(
        { error: "Google Analytics credentials are not properly configured" },
        { status: 503 }
      );
    }

    // Format private key properly
    const privateKey = process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n');

    // Initialize the Data API Client within the request handler
    const dataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: privateKey,
      },
    });

    const propertyId = process.env.GA_PROPERTY_ID;

    // Execute the report request for time series by audience
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [
        { name: "date" },
        { name: "audienceName" }
      ],
      metrics: [
        { name: "activeUsers" }
      ],
    });

    // Transform the data into a format suitable for multi-line chart
    const dataByDate: { [key: string]: any } = {};
    const audiences = new Set<string>();

    response.rows?.forEach((row) => {
      const date = row.dimensionValues?.[0]?.value || "";
      const audience = row.dimensionValues?.[1]?.value || "All Users";
      const users = parseInt(row.metricValues?.[0]?.value || "0");

      audiences.add(audience);

      if (!dataByDate[date]) {
        dataByDate[date] = { date };
      }
      dataByDate[date][audience] = users;
    });

    const chartData = Object.values(dataByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      chartData,
      audiences: Array.from(audiences)
    });
  } catch (error: any) {
    console.error("Audience Timeseries Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch audience timeseries data",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
