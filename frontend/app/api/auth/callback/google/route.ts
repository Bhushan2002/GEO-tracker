import { NextResponse } from "next/server";
import { google } from "googleapis";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";

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
    console.log("Redirect URI:", `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`);

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

    // Get the first account's properties
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
    console.log("Database connected");

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

    console.log("GA Account saved to database:", gaAccount._id);

    // Try to create or find AI Traffic audience
    try {
      const audiencesResponse = await admin.properties.audiences.list({
        parent: firstProperty.name,
      });

      const existingAudiences = audiencesResponse.data.audiences || [];
      let aiAudience = existingAudiences.find((aud: any) =>
        aud.displayName?.toLowerCase().includes("ai traffic")
      );

      if (!aiAudience) {
        // Create new AI Traffic audience
        const createResponse = await admin.properties.audiences.create({
          parent: firstProperty.name,
          requestBody: {
            displayName: "AI Traffic",
            description: "Users who came from AI tools (ChatGPT, Copilot, Perplexity, etc.)",
            membershipDurationDays: 30,
            filterClauses: [
              {
                clauseType: "INCLUDE",
                simpleFilter: {
                  scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS",
                  filterExpression: {
                    orGroup: {
                      filterExpressions: [
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "chatgpt",
                              caseSensitive: false,
                            },
                          },
                        },
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "copilot",
                              caseSensitive: false,
                            },
                          },
                        },
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "perplexity",
                              caseSensitive: false,
                            },
                          },
                        },
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "claude",
                              caseSensitive: false,
                            },
                          },
                        },
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "gemini",
                              caseSensitive: false,
                            },
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

      // Store audience details in GAAccount
      if (aiAudience?.name) {
        gaAccount.aiAudienceId = aiAudience.name;
        gaAccount.aiAudienceName = aiAudience.displayName || "AI Traffic";
        await gaAccount.save();
        console.log("Audience details saved to GAAccount");
      }
    } catch (audienceError: any) {
      console.error("Audience operation error:", audienceError.message);
    }

    // Redirect back with success
    const response = NextResponse.redirect(
      new URL("/google-analytics?connected=true", request.url)
    );

    return response;
  } catch (error: any) {
    console.error("Auth callback error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    return NextResponse.redirect(
      new URL("/google-analytics?error=setup_failed", request.url)
    );
  }
}
