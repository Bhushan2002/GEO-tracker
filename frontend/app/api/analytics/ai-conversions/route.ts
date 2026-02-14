import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId } from "@/lib/workspace-utils";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

/**
 * AI Conversions API.
 * Fetches conversion rates specifically for users coming from AI sources.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';


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
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "keyEvents" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "sessionSourceMedium",
            stringFilter: {
              matchType: "FULL_REGEXP",
              value: "(.*gpt.*|.*chatgpt.*|.*x\\.ai.*|.*grok.*|.*openai.*|.*neeva.*|.*writesonic.*|.*nimble.*|.*outrider.*|.*perplexity.*|.*google\\.bard.*|.*bard.*|.*edgeservices.*|.*gemini\\.google.*|.*claude.*|.*anthropic.*|.*copilot.*|.*bing.*)",
              caseSensitive: false,
            }
          }
        },
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
      'neeva': 'Neeva',
      'writesonic': 'Writesonic',
      'outrider': 'Outrider',
      'nimble': 'Nimble',
      'x.ai': 'Grok',
    };

    const aggregated: Record<string, { sessions: number; conversions: number }> = {};

    response.data.rows?.forEach((row: any) => {
      const source = (row.dimensionValues?.[0]?.value || "").toLowerCase();
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const conversions = parseInt(row.metricValues?.[1]?.value || "0");

      let model = "Other";
      for (const [key, value] of Object.entries(modelMapping)) {
        if (source.includes(key)) {
          model = value;
          break;
        }
      }

      if (model === "Other") return;

      if (!aggregated[model]) {
        aggregated[model] = { sessions: 0, conversions: 0 };
      }
      aggregated[model].sessions += sessions;
      aggregated[model].conversions += conversions;
    });

    const conversionData = Object.entries(aggregated).map(([model, data]) => {
      const rate = data.sessions > 0 ? ((data.conversions / data.sessions) * 100).toFixed(2) : "0.00";
      return {
        model,
        rate: parseFloat(rate),
        conversions: data.conversions
      };
    }).sort((a, b) => b.rate - a.rate);

    return NextResponse.json(conversionData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
