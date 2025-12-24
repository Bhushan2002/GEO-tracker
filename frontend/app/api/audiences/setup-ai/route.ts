import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { NextResponse } from "next/server";

const adminClient = new AnalyticsAdminServiceClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL!,
    private_key: process.env.GA_PRIVATE_KEY?.split(String.raw`\n`).join("\n"),
  },
});

export async function POST(request: Request) {
  const propertyPath = `properties/${process.env.GA_PROPERTY_ID}`;

  try {

    const [audience] = await adminClient.createAudience({
      parent: propertyPath,
      audience: {
        displayName: "First Touch AI Traffic",
        description: "Users whose first interaction was via an AI tool",
        membershipDurationDays: 30,
        eventTrigger:{
          eventName: "first_visit",
          logCondition: "AUDIENCE_JOINED"
        },
        
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
                                matchType: "EXACT",
                                value:  "AI Tools",
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
    console.log("Created AI Audience:", audience);

    return NextResponse.json({ success: true, audience });
  } catch (error: any) {
    console.error("Setup AI Error Details:", error);

    if (error.message?.includes("already exists")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Audience already exists. Please delete it from Google Analytics first or use a different name.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
