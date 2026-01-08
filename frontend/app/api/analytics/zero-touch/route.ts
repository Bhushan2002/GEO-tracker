import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Zero Touch Attribution API.
 * Tracks organic users who did NOT come from direct AI sources,
 * serving as a baseline or control group for comparison.
 */

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

    // Fetch zero touch attribution data
    // This tracks organic users who did NOT come from AI sources initially
    // (may have been influenced by AI mentions but came through organic search)
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "engagedSessions" },
        ],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: "sessionMedium",
                  stringFilter: {
                    matchType: "EXACT",
                    value: "organic",
                    caseSensitive: false,
                  },
                },
              },
              {
                notExpression: {
                  filter: {
                    fieldName: "firstUserSource",
                    inListFilter: {
                      values: ["chatgpt", "perplexity", "copilot", "claude", "gemini"],
                      caseSensitive: false,
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });

    const zeroTouchData = response.data.rows?.map((row: any) => ({
      date: row.dimensionValues?.[0]?.value || "",
      impressions: parseInt(row.metricValues?.[0]?.value || "0"),
      brandSearches: parseInt(row.metricValues?.[1]?.value || "0"),
    })) || [];

    return NextResponse.json(zeroTouchData);

  } catch (error: any) {
    console.error("Error fetching zero touch data:", error);

    // Handle Google Analytics Quota Errors
    if (error.message?.includes("quota") || error.code === 429 || error.status === 429) {
      return NextResponse.json(
        { error: "Google Analytics quota exceeded. Please try again in an hour.", isQuotaError: true },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch zero touch data" },
      { status: 500 }
    );
  }
}
