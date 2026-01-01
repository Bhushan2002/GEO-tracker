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

  // Update token in database
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
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const account = await GAAccount.findOne({ _id: accountId, workspaceId });

    if (!account || !account.isActive) {
      return NextResponse.json(
        { error: "Account not found or inactive" },
        { status: 404 }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(account);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({
      version: "v1beta",
      auth: oauth2Client,
    });

    // Fetch overall traffic
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "engagedSessions" },
          { name: "keyEvents" },
        ],
      },
    });

    // Fetch AI traffic specifically
    const aiTrafficResponse = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
        ],
        dimensionFilter: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: "firstUserSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "chatgpt",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "firstUserSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "perplexity",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "firstUserSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "copilot",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "firstUserSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "claude",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "firstUserSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "gemini",
                    caseSensitive: false,
                  },
                },
              },
            ],
          },
        },
      },
    });

    // Create a map of AI traffic by date
    const aiTrafficMap = new Map();
    aiTrafficResponse.data.rows?.forEach((row: any) => {
      const date = row.dimensionValues?.[0]?.value || "";
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      aiTrafficMap.set(date, users);
    });

    const chartData = response.data.rows?.map((row: any) => ({
      name: row.dimensionValues?.[0]?.value || "",
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      sessions: parseInt(row.metricValues?.[1]?.value || "0"),
      keyEvents: parseInt(row.metricValues?.[2]?.value || "0"),
      aiUsers: aiTrafficMap.get(row.dimensionValues?.[0]?.value) || 0,
    }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    const metrics = {
      activeUsers:
        response.data.rows?.reduce(
          (sum: number, row: any) =>
            sum + parseInt(row.metricValues?.[0]?.value || "0"),
          0
        ) || 0,
      engagedSessions:
        response.data.rows?.reduce(
          (sum: number, row: any) =>
            sum + parseInt(row.metricValues?.[1]?.value || "0"),
          0
        ) || 0,
      keyEvents:
        response.data.rows?.reduce(
          (sum: number, row: any) =>
            sum + parseInt(row.metricValues?.[2]?.value || "0"),
          0
        ) || 0,
    };

    return NextResponse.json({ chartData, metrics });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
