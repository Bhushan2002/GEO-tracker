import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

async function refreshTokenIfNeeded(account: any) {
  const now = new Date();
  if (account.expiresAt > now) {
    return account.accessToken;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GA_CLIENT_ID,
    process.env.GA_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({ refresh_token: account.refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  account.accessToken = credentials.access_token;
  account.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);
  await account.save();

  return credentials.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

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

    console.log('Fetching report for property:', account.propertyId);

    // Execute the report request
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "audienceName" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "sessionConversionRate" },
          { name: "conversions" }
        ],
      }
    });

    console.log('Report response received with', response.data.rows?.length || 0, 'rows');

    // Transform the raw API response into a clean format
    const formattedRows = response.data.rows?.map((row: any) => ({
      audience: row.dimensionValues?.[0]?.value || "Unknown",
      users: row.metricValues?.[0]?.value || "0",
      sessions: row.metricValues?.[1]?.value || "0",
      conversionRate: `${(parseFloat(row.metricValues?.[2]?.value || "0") * 100).toFixed(2)}%`,
      conversions: row.metricValues?.[3]?.value || "0",
    }));

    return NextResponse.json(formattedRows || []);
  } catch (error: any) {
    console.error("Audience Report Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error stack:", error.stack);
    return NextResponse.json({
      error: error.message || "Failed to fetch audience report",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}