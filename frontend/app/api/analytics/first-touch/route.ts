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

  // Update token in database
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

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(account);

    // Check if AI audience exists, if not try to fetch it
    if (!account.aiAudienceId) {
      try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });
        const audiencesResponse = await admin.properties.audiences.list({
          parent: `properties/${account.propertyId}`,
        });

        const existingAudiences = audiencesResponse.data.audiences || [];
        const aiAudience = existingAudiences.find((aud: any) => {
          const dName = aud.displayName?.toLowerCase() || "";
          return dName.includes("ai traffic") || (dName.includes("ai") && dName.includes("traffic"));
        });

        if (aiAudience?.name) {
          account.aiAudienceId = aiAudience.name;
          account.aiAudienceName = aiAudience.displayName || "AI Traffic";
          await account.save();
          console.log("Audience ID fetched and saved:", aiAudience.name);
        } else {
          return NextResponse.json(
            { error: "AI Traffic audience not found. Please reconnect your Google Analytics account to create it." },
            { status: 400 }
          );
        }
      } catch (audienceError: any) {
        console.error("Failed to fetch audience:", audienceError.message);
        return NextResponse.json(
          { error: "Could not verify AI Traffic audience. Please reconnect your Google Analytics account." },
          { status: 400 }
        );
      }
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const analyticsData = google.analyticsdata({
      version: "v1beta",
      auth: oauth2Client,
    });

    // Fetch first touch attribution data from AI Traffic audience
    const response = await analyticsData.properties.runReport({
      property: `properties/${account.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "newUsers" },
          { name: "conversions" },
          { name: "sessions" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "audienceName",
            stringFilter: {
              matchType: "EXACT",
              value: account.aiAudienceName || "AI Traffic",
              caseSensitive: false,
            },
          },
        },
      },
    });

    const firstTouchData = response.data.rows?.map((row: any) => ({
      date: row.dimensionValues?.[0]?.value || "",
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      conversions: parseInt(row.metricValues?.[1]?.value || "0"),
      sessions: parseInt(row.metricValues?.[2]?.value || "0"),
    })) || [];

    return NextResponse.json(firstTouchData);

  } catch (error: any) {
    console.error("Error fetching first touch data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch first touch data" },
      { status: 500 }
    );
  }
}
