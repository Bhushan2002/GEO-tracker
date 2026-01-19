import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get("accountId");


        const startDate = searchParams.get('startDate') || '30daysAgo';
        const endDate = searchParams.get('endDate') || 'today';



        if (!accountId) {
            return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
        }

        await connectDatabase();
        const workspaceId = await getWorkspaceId(request);
        if (!workspaceId) return workspaceError();

        const account = await GAAccount.findOne({ _id: accountId, workspaceId });
        if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

        // Refresh Token Logic (Inline for simplicity)
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GA_CLIENT_ID,
            process.env.GA_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: account.refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();

        const analyticsData = google.analyticsdata({
            version: "v1beta",
            auth: oauth2Client,
        });

        const property = `properties/${account.propertyId}`;
        const dateRanges = [{ startDate: startDate, endDate: endDate }];

        console.log("🔍 Checking AI Overview data for property:", account.propertyId);

        // Method 1: Try event-based detection (requires client to add tracking code)
        let pagesRes, devicesRes;
        let detectionMethod = "event";

        try {
            const eventFilter = {
                filter: {
                    fieldName: "eventName",
                    stringFilter: {
                        matchType: "EXACT",
                        value: "ai_overview_click",
                        caseSensitive: false
                    },
                },
            };

            // Try event-based detection first
            // NOTE: Using the EXACT same query structure as analytics-by-account (which works)
            // Just changing dimension from "date" to "pagePath"
            pagesRes = await analyticsData.properties.runReport({
                property,
                requestBody: {
                    dateRanges,
                    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
                    metrics: [{ name: "eventCount" }],
                    dimensionFilter: {
                        filter: {
                            fieldName: "eventName",
                            stringFilter: {
                                matchType: "EXACT",
                                value: "ai_overview_click",
                                caseSensitive: false
                            },
                        },
                    },
                    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
                    limit: '10',
                },
            });

            // DEBUG: Log raw GA4 response
            console.log("🔍 RAW GA4 Pages Response:", JSON.stringify(pagesRes.data, null, 2));

            devicesRes = await analyticsData.properties.runReport({
                property,
                requestBody: {
                    dateRanges,
                    dimensions: [{ name: "deviceCategory" }],
                    metrics: [{ name: "eventCount" }],
                    dimensionFilter: eventFilter,
                },
            });

            // If no data found with events, try URL-based detection
            if (!pagesRes.data.rows || pagesRes.data.rows.length === 0) {
                console.log("⚠️ No event data found, trying URL-based detection...");
                detectionMethod = "url";

                const urlFilter = {
                    filter: {
                        fieldName: "landingPagePlusQueryString",
                        stringFilter: {
                            matchType: "CONTAINS",
                            value: "#:~:text=",
                            caseSensitive: false
                        },
                    },
                };

                pagesRes = await analyticsData.properties.runReport({
                    property,
                    requestBody: {
                        dateRanges,
                        dimensions: [{ name: "landingPagePlusQueryString" }],
                        metrics: [{ name: "sessions" }],
                        dimensionFilter: urlFilter,
                        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                        limit: '10',
                    },
                });

                devicesRes = await analyticsData.properties.runReport({
                    property,
                    requestBody: {
                        dateRanges,
                        dimensions: [{ name: "deviceCategory" }],
                        metrics: [{ name: "sessions" }],
                        dimensionFilter: urlFilter,
                    },
                });
            }
        } catch (error) {
            console.error("Error in detection:", error);
            throw error;
        }

        const pages = pagesRes.data.rows?.map((row: any) => {
            const path = row.dimensionValues?.[0]?.value || "(not set)";
            // Create a readable title from the path
            const title = path === "/" ? "Home Page" :
                path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || path;

            return {
                path: path,
                title: title,
                clicks: parseInt(row.metricValues?.[0]?.value || "0"),
            };
        }) || [];

        const devices = devicesRes.data.rows?.map((row: any) => ({
            name: row.dimensionValues?.[0]?.value || "unknown",
            value: parseInt(row.metricValues?.[0]?.value || "0"),
        })) || [];

        // Calculate total clicks for debugging
        const totalClicks = pages.reduce((sum, page) => sum + page.clicks, 0);

        console.log("📊 AI Overview Stats Result:", {
            detectionMethod,
            totalPages: pages.length,
            totalClicks,
            hasData: totalClicks > 0,
            startDate,
            endDate
        });

        return NextResponse.json({
            pages,
            devices,
            totalClicks,
            detectionMethod,
            message: totalClicks === 0 ? "No AI Overview traffic detected. Make sure GTM tracking is set up." : undefined
        });

    } catch (error: any) {
        console.error("AI Overview Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}