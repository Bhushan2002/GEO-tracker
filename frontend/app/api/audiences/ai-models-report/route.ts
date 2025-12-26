import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('ga_access_token')?.value;
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;
    const propertyId = cookieStore.get('ga_property_id')?.value;

    console.log('AI Models Report API - Access Token present:', !!accessToken);
    console.log('AI Models Report API - Property ID:', propertyId);

    // Try to refresh token if access token is missing
    if (!accessToken && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GA_CLIENT_ID,
          process.env.GA_CLIENT_SECRET,
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token || undefined;
        console.log('Token refreshed successfully:', !!accessToken);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    if (!accessToken || !propertyId) {
      console.error('Missing credentials - accessToken:', !!accessToken, 'propertyId:', propertyId);
      return NextResponse.json(
        { error: "Not authenticated. Please connect Google Analytics first." },
        { status: 401 }
      );
    }

    // Use user's OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    console.log('Fetching AI models traffic report for property:', propertyId);

    // Execute the report request to get traffic by source domain
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
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

    const result = NextResponse.json(formattedData);

    // Update access token cookie if it was refreshed
    if (accessToken && !cookieStore.get('ga_access_token')?.value) {
      result.cookies.set('ga_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
      });
    }

    return result;
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
