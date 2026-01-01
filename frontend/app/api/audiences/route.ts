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

    // Use v1alpha version which has audiences resource
    const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

    console.log('Fetching audiences for property:', account.propertyId);

    // List all audiences
    const audiencesResponse = await admin.properties.audiences.list({
      parent: `properties/${account.propertyId}`,
    });

    const audiences = audiencesResponse.data.audiences || [];

    console.log('Audiences found:', audiences.length);

    // Check if AI Tools audience already exists
    const aiToolsAudienceExists = audiences.some((audience: any) =>
      audience.displayName === "AI Tools Traffic" ||
      audience.displayName?.toLowerCase().includes("ai tools")
    );

    // If no AI Tools audience exists, automatically create it
    if (!aiToolsAudienceExists) {
      console.log('AI Tools audience not found. Creating default "AI Tools Traffic" audience...');

      try {
        const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

        const newAudience = await admin.properties.audiences.create({
          parent: `properties/${account.propertyId}`,
          requestBody: {
            displayName: "AI Tools Traffic",
            description: "Users whose first interaction was via an AI tool (ChatGPT, Perplexity, etc.)",
            membershipDurationDays: 30,
            eventTrigger: {
              eventName: "first_visit",
              logCondition: "AUDIENCE_JOINED"
            },
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
                              caseSensitive: false
                            }
                          }
                        },
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "perplexity",
                              caseSensitive: false
                            }
                          }
                        },
                        {
                          dimensionOrMetricFilter: {
                            fieldName: "firstUserSource",
                            stringFilter: {
                              matchType: "CONTAINS",
                              value: "gemini",
                              caseSensitive: false
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        });

        console.log('Successfully created AI Tools audience:', newAudience.data.name);

        // Add the newly created audience to the list
        audiences.push(newAudience.data);
      } catch (createError: any) {
        console.error('Failed to auto-create AI Tools audience:', createError.message);

        // Check if error is due to audience already existing
        if (createError.message?.includes("already exists") || createError.code === 6) {
          console.log('AI Tools audience already exists (detected via error), skipping creation');
        }
        // Continue even if creation fails - return current list
      }
    } else {
      console.log('AI Tools audience already exists, skipping creation');
    }

    // Format the response
    const formattedAudiences = audiences.map((audience: any) => ({
      name: audience.name,
      displayName: audience.displayName,
      description: audience.description,
      membershipDurationDays: audience.membershipDurationDays,
      createdAt: audience.createTime,
    }));

    return NextResponse.json(formattedAudiences);
  } catch (error: any) {
    console.error("List Audiences Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error stack:", error.stack);
    return NextResponse.json({
      error: error.message || "Failed to list audiences",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}