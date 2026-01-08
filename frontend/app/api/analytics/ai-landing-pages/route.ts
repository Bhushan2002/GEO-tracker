import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";


/**
 * AI Landing Pages API.
 * Identifies the top landing pages for users arriving from AI sources.
 * Helps understand which content is most visible to AI models.
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
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account Id is required" },
        { status: 400 }
      );
    }

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    const account = await GAAccount.findOne({
      _id: accountId,
      workspaceId: workspaceId,
    });

    if (!account || !account.isActive) {
      return NextResponse.json(
        { error: "Account not found or inactive" },
        { status: 404 }
      );
    }

    const accessToken = await refreshTokenIfNeeded(account);

    const oauth2Client = new google.auth.OAuth2();

    oauth2Client.setCredentials({ access_token: accessToken });
    const analyticsData = google.analyticsdata({
      version: "v1beta",
      auth: oauth2Client,
    });

    // Try with sessionSource filter (more common for AI traffic tracking)
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [
          { name: "landingPage" },
          { name: "sessionSource" }
        ],
        metrics: [{ name: "activeUsers" }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: "sessionSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "chatgpt",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "sessionSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "perplexity",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "sessionSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "copilot",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "sessionSource",
                  stringFilter: {
                    matchType: "CONTAINS",
                    value: "claude",
                    caseSensitive: false,
                  },
                },
              },
              {
                filter: {
                  fieldName: "sessionSource",
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
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "10",
      },
    });

    /* Debug logs kept for monitoring AI traffic anomalies */
    // console.log("GA API Response:", JSON.stringify(response.data, null, 2));

    const landingPageData =
      response.data.rows?.map((row: any) => ({
        page: row.dimensionValues?.[0]?.value || "/",
        source: row.dimensionValues?.[1]?.value || "unknown",
        users: parseInt(row.metricValues?.[0]?.value || "0"),
      })) || [];

    // If no data found, log possible reasons (helpful for debugging user setups)
    if (landingPageData.length === 0) {
      console.log("⚠️ No AI landing page data found. Possible reasons:");
      console.log("   1. No traffic from AI sources (chatgpt, perplexity, copilot, claude, gemini)");
      console.log("   2. Traffic exists but sessionSource doesn't match the filter");
      console.log("   3. Data might be tracked under different dimension (firstUserSource, etc)");
    }

    return NextResponse.json({ landingPageData });
  } catch (error: any) {
    console.error("AI Landing Pages Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch AI landing page data", details: error.message },
      { status: 500 }
    );
  }
}
