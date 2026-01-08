import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

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

    const aiSources = ["chatgpt", "perplexity", "copilot", "claude", "gemini"];

    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
        dimensions: [
          { name: "country" }, 
          { name: "firstUserSource" }
        ],
        metrics: [{ name: "activeUsers" }],
        dimensionFilter: {  
          orGroup: {
            expressions: aiSources.map(source => ({
              filter: {
                fieldName: "firstUserSource",
                stringFilter: { matchType: "CONTAINS", value: source, caseSensitive: false }
              }
            }))
          }
        },
        limit: "100" // Fetch enough rows to cover top countries * models
      },
    });

    // Process Data: Pivot to { country: "USA", chatgpt: 10, perplexity: 5 }
    const countryMap: Record<string, any> = {};

    response.data.rows?.forEach((row: any) => {
      const country = row.dimensionValues?.[0]?.value || "Unknown";
      let source = row.dimensionValues?.[1]?.value || "Other";
      const users = parseInt(row.metricValues?.[0]?.value || "0");

      // Normalize source name (e.g., "openai / chatgpt" -> "ChatGPT")
      if (source.includes("chatgpt")) source = "ChatGPT";
      else if (source.includes("perplexity")) source = "Perplexity";
      else if (source.includes("copilot")) source = "Copilot";
      else if (source.includes("claude")) source = "Claude";
      else if (source.includes("gemini")) source = "Gemini";

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