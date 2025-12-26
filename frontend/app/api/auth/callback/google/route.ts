import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

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
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
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

    // Get the first account's properties (or you can let user choose)
    const firstAccount = accounts[0].name;
    const propertiesResponse = await admin.properties.list({
      filter: `parent:${firstAccount}`,
    });

    const properties = propertiesResponse.data.properties || [];

    if (properties.length === 0) {
      return NextResponse.redirect(
        new URL("/google-analytics?error=no_properties", request.url)
      );
    }

    // Use the first property (you can add UI to let user select later)
    const firstProperty = properties[0];
    const propertyId = firstProperty.name?.split("/")[1] || "";

    if (!firstProperty.name) {
      return NextResponse.redirect(
        new URL("/google-analytics?error=invalid_property", request.url)
      );
    }

    // Try to create the audience on user's property
    try {
      const audiencesResponse = await admin.properties.audiences.list({
        parent: firstProperty.name,
      });

      const existingAudiences = audiencesResponse.data.audiences || [];

      // Check if any AI Traffic audience already exists (including variations like "AI Traffic 2025-12-23...")
      const aiTrafficAudienceExists = existingAudiences.some((aud: any) =>
        aud.displayName?.toLowerCase().includes("ai traffic")
      );

      if (aiTrafficAudienceExists) {
        console.log("AI Traffic audience already exists, skipping creation");
      } else {
        await admin.properties.audiences.create({
          parent: firstProperty.name,
          requestBody: {
            displayName: "AI Traffic",
            description: "Users who came from AI tools",
            membershipDurationDays: 30,
            filterClauses: [
              {
                simpleFilter: {
                  scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS",
                  filterExpression: {
                    andGroup: {
                      filterExpressions: [
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "AI Tools",
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
        console.log("AI Traffic audience created successfully");
      }
    } catch (audienceError: any) {
      console.error("Audience operation error:", audienceError.message);
    }

    // Store tokens and property info in encrypted cookies
    const response = NextResponse.redirect(
      new URL("/google-analytics", request.url)
    );

    // Store tokens securely (encrypt in production!)
    response.cookies.set("ga_access_token", tokens.access_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    if (tokens.refresh_token) {
      response.cookies.set("ga_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Store property ID
    response.cookies.set("ga_property_id", propertyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set("ga_connected", "true");

    return response;
  } catch (error) {
    console.error("Auth/Audience Error:", error);
    return NextResponse.redirect(
      new URL("/google-analytics?error=setup_failed", request.url)
    );
  }
}
