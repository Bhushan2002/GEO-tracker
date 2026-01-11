import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId } from "@/lib/workspace-utils";

/**
 * AI Conversions API.
 * Fetches conversion rates specifically for users coming from AI sources.
 * Helper function `refreshTokenIfNeeded` ensures valid credentials.
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
  account.expiresAt = new Date(
    credentials.expiry_date || Date.now() + 3600 * 1000
  );
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

    // Fetch conversion metrics filtered by AI sources using sessionSourceMedium
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "keyEvents" }, // This represents conversions in GA4
        ],
        dimensionFilter: {
          filter: {
            fieldName: "sessionSourceMedium",
            stringFilter: {
              matchType: "FULL_REGEXP",
              value: "(.*gpt.*|.*chatgpt.*|.*x\\.ai.*|.*grok.*|.*openai.*|.*neeva.*|.*writesonic.*|.*nimble.*|.*outrider.*|.*perplexity.*|.*google\\.bard.*|.*bard.*|.*edgeservices.*|.*gemini\\.google.*)",
              caseSensitive: false,
            }
          }
        },
      },
    });

    const conversionData =
      response.data.rows?.map((row: any) => {
        const sessions = parseInt(row.metricValues?.[0]?.value || "0");
        const conversions = parseInt(row.metricValues?.[1]?.value || "0");
        const rate =
          sessions > 0 ? ((conversions / sessions) * 100).toFixed(2) : "0.00";

        return {
          model: row.dimensionValues?.[0]?.value || "Unknown",
          rate: parseFloat(rate),
          conversions: conversions,
        };
      }) || [];

    return NextResponse.json(conversionData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
