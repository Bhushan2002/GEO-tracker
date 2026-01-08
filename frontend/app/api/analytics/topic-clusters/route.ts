import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Topic Clusters API.
 * Groups visited pages into "Clusters" or "Topics" based on URL path segments.
 * Useful for understanding content affinity for AI traffic.
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

    // Fetch pages visited by AI sources
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "activeUsers" }],
        dimensionFilter: {
          orGroup: {
            expressions: ["chatgpt", "perplexity", "copilot", "claude", "gemini"].map(model => ({
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
