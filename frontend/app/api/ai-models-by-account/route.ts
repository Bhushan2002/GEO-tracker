import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * AI Models By Account API.
 * Aggregates GA4 traffic data to show performance by AI Model (ChatGPT, Claude, Gemini, etc.).
 * Maps raw source strings to user-friendly model names.
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

    const accessToken = await refreshTokenIfNeeded(account);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: oauth2Client,
    });

    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "firstUserSource" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "sessionConversionRate" },
        ],
        orderBys: [
          {
            metric: { metricName: "activeUsers" },
            desc: true,
          },
        ],
      },
    });

    const modelMapping: { [key: string]: string } = {
      'chatgpt': 'ChatGPT',
      'openai': 'ChatGPT',
      'claude': 'Claude',
      'anthropic': 'Claude',
      'gemini': 'Gemini',
      'bard': 'Gemini',
      'perplexity': 'Perplexity',
      'deepseek': 'DeepSeek',
      'grok': 'Grok',
      'copilot': 'Copilot',
      'bing': 'Copilot',
      'edgeservices': 'Copilot',
    };

    const modelData: { [key: string]: any } = {};

    response.data.rows?.forEach((row: any) => {
      const source = (row.dimensionValues?.[0]?.value || "Unknown").toLowerCase();
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      const sessions = parseInt(row.metricValues?.[1]?.value || "0");
      const conversionRate = parseFloat(row.metricValues?.[2]?.value || "0") * 100;

      let model = "Other";
      for (const [key, value] of Object.entries(modelMapping)) {
        if (source.includes(key)) {
          model = value;
          break;
        }
      }

      if (!modelData[model]) {
        modelData[model] = {
          model,
          source: row.dimensionValues?.[0]?.value || "Unknown",
          users: 0,
          sessions: 0,
          conversionRate: 0,
        };
      } else {
        if (!modelData[model].source.includes(row.dimensionValues?.[0]?.value)) {
          modelData[model].source += `, ${row.dimensionValues?.[0]?.value}`;
        }
      }

      modelData[model].users += users;
      modelData[model].sessions += sessions;
      modelData[model].conversionRate = Math.max(
        modelData[model].conversionRate,
        conversionRate
      );
    });

    const formattedData = Object.values(modelData)
      .sort((a: any, b: any) => b.users - a.users)
      .map((item: any) => ({
        ...item,
        conversionRate: `${item.conversionRate.toFixed(2)}%`,
      }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error("AI Models Report Error:", error);

    // Handle Google Analytics Quota Errors
    if (error.message?.includes("quota") || error.code === 429 || error.status === 429) {
      return NextResponse.json(
        { error: "Google Analytics quota exceeded. Please try again in an hour.", isQuotaError: true },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch AI models report" },
      { status: 500 }
    );
  }
}
