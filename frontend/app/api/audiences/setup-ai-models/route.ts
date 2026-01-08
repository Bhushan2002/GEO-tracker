import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Setup AI Models Audience API - POST.
 * Automatically creates the "AI Traffic" audience in the user's GA4 property if it doesn't exist.
 * Specifies regex filters to capture traffic from known AI sources (ChatGPT, Claude, Gemini, etc.).
 */

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

export async function POST(request: NextRequest) {
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

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

    const propertyPath = `properties/${account.propertyId}`;

    // Check for existing audience
    const audiencesResponse = await admin.properties.audiences.list({
      parent: propertyPath,
    });

    const existingAudiences = audiencesResponse.data.audiences || [];
    const aiAudience = existingAudiences.find((aud: any) => {
      const dName = aud.displayName?.toLowerCase() || "";
      return dName === "ai traffic" || dName.includes("ai traffic");
    });

    if (aiAudience) {
      // Update the account with the audience info if not already set
      if (!account.aiAudienceId) {
        account.aiAudienceId = aiAudience.name;
        account.aiAudienceName = aiAudience.displayName;
        await account.save();
      }
      return NextResponse.json({
        success: true,
        audience: aiAudience,
        message: "AI Traffic audience already exists"
      });
    }

    // Create the audience with comprehensive AI source filters
    const audience = await admin.properties.audiences.create({
      parent: propertyPath,
      requestBody: {
        displayName: "AI Traffic",
        description: "Users coming from various AI model sources (ChatGPT, Claude, Gemini, etc)",
        membershipDurationDays: 30,
        filterClauses: [
          {
            clauseType: "INCLUDE",
            simpleFilter: {
              scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS",
              filterExpression: {
                andGroup: {
                  filterExpressions: [
                    {
                      orGroup: {
                        filterExpressions: [
                          {
                            dimensionOrMetricFilter: {
                              fieldName: "firstUserSource",
                              stringFilter: {
                                matchType: "FULL_REGEXP",
                                value:
                                  "(chatgpt|openai|anthropic|deepseek|grok)\\.com|(gemini|bard)\\.google\\.com|(perplexity|claude)\\.ai|(copilot\\.microsoft|edgeservices\\.bing)\\.com|edge.*copilot",
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });

    // Save the audience info to the account
    account.aiAudienceId = audience.data.name;
    account.aiAudienceName = audience.data.displayName;
    await account.save();

    console.log('AI Traffic audience created and saved:', audience.data.name);

    return NextResponse.json({
      success: true,
      audience: audience.data,
      message: "AI Traffic audience created successfully"
    });
  } catch (error: any) {
    console.error("Setup AI Models Error:", error.message);

    if (error.message?.includes("already exists") || error.code === 6) {
      return NextResponse.json(
        {
          success: false,
          error: "AI Traffic audience already exists for this property."
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create AI Traffic audience"
    }, { status: 500 });
  }
}
