import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

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

    // Fetch monthly sessions for AI sources
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          orGroup: {
             // Using widely known AI identifiers
            expressions: ["chatgpt", "perplexity", "copilot", "claude", "gemini", "ai_search", "generative"].map(model => ({
              filter: {
                fieldName: "sessionSource",
                stringFilter: { matchType: "CONTAINS", value: model, caseSensitive: false }
              }
            }))
          }
        },
        orderBys: [{ dimension: { dimensionName: "yearMonth" } }]
      },
    });

    const rows = response.data.rows || [];
    const monthlyData = rows.map((row: any) => {
      const yearMonth = row.dimensionValues?.[0]?.value || "";
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      
      // Format yearMonth (YYYYMM) to "MMM YYYY"
      const year = yearMonth.substring(0, 4);
      const month = yearMonth.substring(4, 6);
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const formattedDate = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      return {
        date: formattedDate,
        rawDate: yearMonth,
        sessions
      };
    });

    // Calculate Month-over-Month Growth
    const growthData = monthlyData.map((current, index) => {
      if (index === 0) {
        return { ...current, growth: 0 };
      }
      const previous = monthlyData[index - 1];
      const growth = previous.sessions > 0 
        ? ((current.sessions - previous.sessions) / previous.sessions) * 100 
        : 100; // If previous was 0 and now we have sessions, it's 100% growth (or treated as new)
      
      return {
        ...current,
        growth: parseFloat(growth.toFixed(1))
      };
    });
    
    // Remove the first month as it serves only as a baseline and has 0 growth
    // But we might want to keep it if we just start at 0. Let's keep it but users should know.
    // Actually, usually growth charts omit the first baseline point or show it as 0. 
    // Let's return all, the chart can decide how to render.

    return NextResponse.json(growthData);

  } catch (error: any) {
    console.error("Error fetching AI growth data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
