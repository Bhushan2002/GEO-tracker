import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * AI Device Split API.
 * Returns the distribution of device categories (desktop, mobile, etc.) for users coming from AI sources.
 */

async function refreshTokenIfNeeded(account: any) {
  const now = new Date();
  if (account.expiresAt > now) return account.accessToken;

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
    if (!accountId) return NextResponse.json({ error: "Account ID required" }, { status: 400 });

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const account = await GAAccount.findOne({ _id: accountId, workspaceId });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const accessToken = await refreshTokenIfNeeded(account);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth: oauth2Client });

    // Fetch device category for AI sources
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "sessionSourceMedium",
            stringFilter: {
              matchType: "FULL_REGEXP",
              value: "(.*gpt.*|.*chatgpt.*|.*x\.ai.*|.*grok.*|.*openai.*|.*neeva.*|.*writesonic.*|.*nimble.*|.*outrider.*|.*perplexity.*|.*google\.bard.*|.*bard.*|.*edgeservices.*|.*gemini\.google.*)",
              caseSensitive: false,
            }
          }
        }
      },
    });

    const rows = response.data.rows || [];
    const deviceData = rows.map((row: any) => ({
      name: row.dimensionValues?.[0]?.value || "Unknown",
      value: parseInt(row.metricValues?.[0]?.value || "0")
    })).sort((a: any, b: any) => b.value - a.value);

    return NextResponse.json(deviceData);

  } catch (error: any) {
    console.error("Error fetching AI device data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
