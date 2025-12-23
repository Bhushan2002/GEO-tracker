import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

const dataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

export async function GET() {
  try {
    const [response] = await dataClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "audienceName" }], // Groups data by the audiences you created
      metrics: [
        { name: "activeUsers" },
        { name: "cohortActiveUsers" }, // Specifically for cohort return rates
        { name: "sessionConversionRate" }
      ],
    });

    const report = response.rows?.map(row => ({
      audience: row.dimensionValues?.[0].value,
      users: row.metricValues?.[0].value,
      conversionRate: `${(parseFloat(row.metricValues?.[2].value || "0") * 100).toFixed(2)}%`
    }));

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}