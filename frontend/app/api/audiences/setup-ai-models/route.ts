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
    const audience = await adminClient.createAudience({
      parent: propertyPath,
      audience: {
        displayName: "AI Models Traffic",
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
    console.log("Created AI Models Audience:", audience);

    return NextResponse.json({ success: true, audience });
  } catch (error: any) {
    console.error("Setup AI Models Error Details:", error);

    if (error.message?.includes("already exists")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI Models audience already exists. Please delete it from Google Analytics first or use a different name.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
