import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

/**
 * Audiences Timeseries API.
 * Fetches daily active user counts for each audience (e.g., "AI Traffic" vs "All Users") over the last 30 days.
 * Used for comparing trends and growth of different user segments.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'endDate';

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const account = await GAAccount.findOne({ _id: accountId, workspaceId });

    if (!account || !account.isActive) {
      return NextResponse.json({ error: "Account not found or inactive" }, { status: 404 });
    }

    const accessToken = await refreshTokenIfNeeded(account);

    // Use user's OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    // console.log(`Fetching timeseries data for property: ${account.propertyId}`);

    // Execute the report request for time series by audience
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [
          { name: "date" },
          { name: "audienceName" }
        ],
        metrics: [
          { name: "activeUsers" }
        ],
      }
    });

    // console.log(`Response received with ${response.data.rows?.length || 0} rows`);

    // Transform the data into a format suitable for multi-line chart
    const dataByDate: { [key: string]: any } = {};
    const audiences = new Set<string>();

    response.data.rows?.forEach((row: any) => {
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

    // console.log(`Processed ${chartData.length} data points for ${audiences.size} audiences`);
    // console.log(`Audiences found: ${Array.from(audiences).join(', ')}`);

    return NextResponse.json({
      chartData,
      audiences: Array.from(audiences)
    });
  } catch (error: any) {
    console.error("Audience Timeseries Error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch audience timeseries data",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
