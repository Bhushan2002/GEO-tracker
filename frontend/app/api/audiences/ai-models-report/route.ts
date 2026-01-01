import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

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
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const account = await GAAccount.findOne({ _id: accountId, workspaceId });

    if (!account || !account.isActive) {
      return NextResponse.json({ error: "Account not found or inactive" }, { status: 404 });
    }

    const accessToken = await refreshTokenIfNeeded(account);

    // Use user's OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    console.log('Fetching AI models traffic report for property:', account.propertyId);

    // Execute the report request to get traffic by source domain
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

    console.log('Report response received with', response.data.rows?.length || 0, 'rows');

    // Log all sources to see what we're getting
    response.data.rows?.forEach((row: any) => {
      const source = row.dimensionValues?.[0]?.value || "Unknown";
      const users = row.metricValues?.[0]?.value || "0";
      console.log(`Source: ${source}, Users: ${users}`);
    });

    // Map sources to AI models with multiple domain variations
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

    // Transform the raw API response into a clean format grouped by model
    const modelData: { [key: string]: any } = {};

    response.data.rows?.forEach((row: any) => {
      const source = (row.dimensionValues?.[0]?.value || "Unknown").toLowerCase();
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      const sessions = parseInt(row.metricValues?.[1]?.value || "0");
      const conversionRate = parseFloat(row.metricValues?.[2]?.value || "0") * 100;

      // Find matching model
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
        // If model already exists, append source if different
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

    console.log('Model data before filtering:', modelData);

    // Convert to array and sort by users (include "Other" for debugging)
    const formattedData = Object.values(modelData)
      .sort((a: any, b: any) => b.users - a.users)
      .map((item: any) => ({
        ...item,
        conversionRate: `${item.conversionRate.toFixed(2)}%`,
      }));

    console.log('Formatted AI models data:', formattedData);

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error("AI Models Report Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch AI models report",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
