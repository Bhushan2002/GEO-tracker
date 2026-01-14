import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * AI Demographics API.
 * Analyzes the breakdown of users by country for various AI sources.
 */

// Reuse the token refresh logic
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

    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';



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



    // Fetch active users by country, filtered by AI sources
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [
          { name: "country" },
          { name: "sessionSourceMedium" }
        ],
        metrics: [{ name: "activeUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "sessionSourceMedium",
            stringFilter: {
              matchType: "FULL_REGEXP",
              value: "(.*gpt.*|.*chatgpt.*|.*x\.ai.*|.*grok.*|.*openai.*|.*neeva.*|.*writesonic.*|.*nimble.*|.*outrider.*|.*perplexity.*|.*google\.bard.*|.*bard.*|.*edgeservices.*|.*gemini\.google.*)",
              caseSensitive: false,
            }
          }
        },
        limit: "1000"
      },
    });

    // Process Data: Pivot to { country: "USA", chatgpt: 10, perplexity: 5 }
    const countryMap: Record<string, any> = {};

    response.data.rows?.forEach((row: any) => {
      const country = row.dimensionValues?.[0]?.value || "Unknown";
      let source = row.dimensionValues?.[1]?.value || "Other";
      const users = parseInt(row.metricValues?.[0]?.value || "0");

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
        'neeva': 'Neeva',
        'writesonic': 'Writesonic',
        'outrider': 'Outrider',
        'nimble': 'Nimble',
        'x.ai': 'Grok',
      };

      let matchedModel = "Other";
      for (const [key, value] of Object.entries(modelMapping)) {
        if (source.includes(key)) {
          matchedModel = value;
          break;
        }
      }
      source = matchedModel;

      if (source === "Other") return;

      if (!countryMap[country]) {
        countryMap[country] = { country, total: 0 };
      }

      if (!countryMap[country][source]) countryMap[country][source] = 0;
      countryMap[country][source] += users;
      countryMap[country].total += users;
    });

    // Convert map to array and sort by total users (top 10 countries)
    const chartData = Object.values(countryMap)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10);

    return NextResponse.json(chartData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
