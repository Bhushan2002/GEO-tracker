import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

/**
 * Topic Clusters API.
 * Groups visited pages into "Clusters" or "Topics" based on URL path segments.
 * Useful for understanding content affinity for AI traffic.
 */

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

    // Fetch pages visited by AI sources
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "activeUsers" }],
        dimensionFilter: {
          orGroup: {
            expressions: ["chatgpt", "openai", "perplexity", "copilot", "bing", "claude", "anthropic", "gemini", "bard"].map(model => ({
              filter: {
                fieldName: "firstUserSource",
                stringFilter: { matchType: "CONTAINS", value: model, caseSensitive: false }
              }
            }))
          }
        },
        limit: "100" // Get enough pages to group effectively
      },
    });

    // Process and Group Data
    const clusters: Record<string, number> = {};

    response.data.rows?.forEach((row: any) => {
      const path = row.dimensionValues?.[0]?.value || "/";
      const users = parseInt(row.metricValues?.[0]?.value || "0");

      // Extract the first segment as the "Topic" (e.g., /blog/post-1 -> blog)
      const parts = path.split('/').filter((p: string) => p !== "");
      let topic = parts.length > 0 ? parts[0] : "Home";

      // Capitalize
      topic = topic.charAt(0).toUpperCase() + topic.slice(1);

      if (!clusters[topic]) clusters[topic] = 0;
      clusters[topic] += users;
    });

    // Format for Recharts Treemap (requires 'children' array or name/size structure)
    const treeMapData = Object.entries(clusters)
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size); // Sort largest to smallest

    return NextResponse.json(treeMapData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
