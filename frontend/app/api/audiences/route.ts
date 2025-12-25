import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('ga_access_token')?.value;
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;
    const propertyId = cookieStore.get('ga_property_id')?.value;
    
    console.log('Audiences API - Access Token present:', !!accessToken);
    console.log('Audiences API - Property ID:', propertyId);
    
    // Try to refresh token if access token is missing
    if (!accessToken && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GA_CLIENT_ID,
          process.env.NEXT_PUBLIC_GA_CLIENT_SECRET,
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
    
    // Use v1alpha version which has audiences resource
    const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

    console.log('Fetching audiences for property:', propertyId);

    // List all audiences
    const audiencesResponse = await admin.properties.audiences.list({
      parent: `properties/${propertyId}`,
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
          parent: `properties/${propertyId}`,
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

    const response = NextResponse.json(formattedAudiences);
    
    // Update access token cookie if it was refreshed
    if (accessToken && !cookieStore.get('ga_access_token')?.value) {
      response.cookies.set('ga_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
      });
    }

    return response;
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