import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

/**
 * AI Growth Month-Over-Month API.
 * Calculates the monthly growth percentage of sessions originating from AI/LLM sources over the last year.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    if (!accountId) return NextResponse.json({ error: "Account ID required" }, { status: 400 });

    const startDate = searchParams.get('startDate') || '365daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

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
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: "yearMonth" }],
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

    return NextResponse.json(growthData);

  } catch (error: any) {
    console.error("Error fetching AI growth data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
