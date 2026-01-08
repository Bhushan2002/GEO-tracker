import { NextResponse } from "next/server";
import { google } from "googleapis";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";

/**
 * Google OAuth Callback API.
 * Handles the redirect from Google's OAuth consent screen.
 * 1. Exchanges auth code for access/refresh tokens.
 * 2. Fetches user's GA4 accounts and properties.
 * 3. Saves credentials to the `GAAccount` collection.
 * 4. Automatically checks for or creates an "AI Traffic" audience in GA4.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const workspaceId = searchParams.get("state"); // Workspace ID passed in state

  if (!code) {
    return NextResponse.redirect(
      new URL("/google-analytics?error=no_code", request.url)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GA_CLIENT_ID,
    process.env.GA_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
  );

  try {
    console.log("OAuth callback received with code");

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received successfully");
    oauth2Client.setCredentials(tokens);

    // Get user's GA4 properties using Admin API
    const admin = google.analyticsadmin({
      version: "v1alpha",
      auth: oauth2Client,
    });

    // List all accounts the user has access to
    const accountsResponse = await admin.accounts.list();
    const accounts = accountsResponse.data.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.redirect(
        new URL("/google-analytics?error=no_accounts", request.url)
      );
    }

    // Default to the first account and property for the MVP
    // Future improvement: Allow user to select specific account/property if multiple exist
    const firstAccount = accounts[0];
    const accountId = firstAccount.name?.split("/")[1] || "";
    const propertiesResponse = await admin.properties.list({
      filter: `parent:${firstAccount.name}`,
    });

    const properties = propertiesResponse.data.properties || [];

    if (properties.length === 0) {
      return NextResponse.redirect(
        new URL("/google-analytics?error=no_properties", request.url)
      );
    }

    // Use the first property
    const firstProperty = properties[0];
    const propertyId = firstProperty.name?.split("/")[1] || "";

    if (!firstProperty.name || !tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/google-analytics?error=invalid_property", request.url)
      );
    }

    // Calculate token expiry
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    // Save to database
    console.log("Connecting to database...");
    await connectDatabase();

    console.log("Saving account with propertyId:", propertyId);
    const gaAccount = await GAAccount.findOneAndUpdate(
      { propertyId: propertyId },
      {
        workspaceId: workspaceId,
        accountName: firstAccount.displayName || "Google Analytics Account",
        accountId: accountId,
        propertyId: propertyId,
        propertyName: firstProperty.displayName || "Property",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: expiresAt,
        isActive: true,
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log("GA Account link saved/updated:", gaAccount._id);

    // --- Audience Creation Logic ---
    // Automatically attempts to create an "AI Traffic" audience in the user's GA4 property
    // to track users coming from known AI sources (ChatGPT, Claude, etc.)
    try {
      const audiencesResponse = await admin.properties.audiences.list({
        parent: firstProperty.name,
      });

      const existingAudiences = audiencesResponse.data.audiences || [];
      let aiAudience = existingAudiences.find((aud: any) =>
        aud.displayName?.toLowerCase().includes("ai traffic")
      );

      if (!aiAudience) {
        // Create new AI Traffic audience with regex filters for AI referrers
        const createResponse = await admin.properties.audiences.create({
          parent: firstProperty.name,
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
        aiAudience = createResponse.data;
        console.log("AI Traffic audience created successfully:", aiAudience?.name);
      } else {
        console.log("AI Traffic audience already exists:", aiAudience.name);
      }

      // Store audience resource name in our DB for future reference
      if (aiAudience?.name) {
        gaAccount.aiAudienceId = aiAudience.name;
        gaAccount.aiAudienceName = aiAudience.displayName || "AI Traffic";
        await gaAccount.save();
      }
    } catch (audienceError: any) {
      console.error("Audience operation warning (non-fatal):", audienceError.message);
    }

    // Redirect back to dashboard with success flag
    return NextResponse.redirect(
      new URL("/google-analytics?connected=true", request.url)
    );
  } catch (error: any) {
    console.error("Auth callback fatal error:", error);
    return NextResponse.redirect(
      new URL("/google-analytics?error=setup_failed", request.url)
    );
  }
}
