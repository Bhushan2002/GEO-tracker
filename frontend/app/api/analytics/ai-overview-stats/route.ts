import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

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

        // Use centralized token refresh utility
        const accessToken = await refreshTokenIfNeeded(account);

        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GA_CLIENT_ID,
            process.env.GA_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: accessToken });

        const analyticsData = google.analyticsdata({
            version: "v1beta",
            auth: oauth2Client,
        });

        const property = `properties/${account.propertyId}`;
        const dateRanges = [{ startDate: startDate, endDate: endDate }];

        console.log("🔍 Checking AI Overview data for property:", account.propertyId);

        // Method 1: Try event-based detection (requires client to add tracking code)
        let pagesRes, devicesRes , countriesRes , trendRes, totalUsersRes;
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

            // Fetch total users metric
            totalUsersRes = await analyticsData.properties.runReport({
                property,
                requestBody: {
                    dateRanges,
                    metrics: [{ name: "totalUsers" }],
                    dimensionFilter: eventFilter,
                },
            });

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

            countriesRes = await analyticsData.properties.runReport({
                property,
                requestBody: {
                    dateRanges,
                    dimensions: [{ name: "country" }],
                    metrics: [{ name: "eventCount" }],
                    dimensionFilter: eventFilter,
                    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
                },
            });
            // tread (daily date)
            trendRes = await analyticsData.properties.runReport({
                property,
                requestBody: {
                    dateRanges,
                    dimensions: [{ name: "date" }], // Group by Date
                    metrics: [{ name: "eventCount" }],
                    dimensionFilter: eventFilter,
                    orderBys: [{ dimension: { dimensionName: "date" }, desc: false }], // Sort by date ascending
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

                // fetch countries data (url based fallback)
                countriesRes = await analyticsData.properties.runReport({
                    property,
                    requestBody: {
                        dateRanges,
                        dimensions: [{ name: "country" }],
                        metrics: [{ name: "sessions" }],
                        dimensionFilter: urlFilter,
                        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                    },
                });
                // tred (daily date)fallback
                trendRes = await analyticsData.properties.runReport({
                    property,
                    requestBody: {
                        dateRanges,
                        dimensions: [{ name: "date" }],
                        metrics: [{ name: "sessions" }], // Use sessions for URL method
                        dimensionFilter: urlFilter,
                        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
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
        
        // Extract total users from the API response
        const totalUsers = parseInt(totalUsersRes?.data?.rows?.[0]?.metricValues?.[0]?.value || "0");

        // console.log("📊 AI Overview Stats Result:", {
        //     detectionMethod,
        //     totalPages: pages.length,
        //     totalClicks,
        //     hasData: totalClicks > 0,
        //     startDate,
        //     endDate
        // });
        const countries = countriesRes?.data?.rows?.map((row: any) => ({
            name: row.dimensionValues?.[0]?.value || "Unknown",
            value: parseInt(row.metricValues?.[0]?.value || "0"),
        })) || [];

        const trend = trendRes.data.rows?.map((row: any) => {
            // Convert YYYYMMDD to readable format if needed, or keep as is for Recharts
            const dateStr = row.dimensionValues?.[0]?.value || "";
            // Format: "Jan 19" for better readability
            let formattedDate = dateStr;
            if (dateStr.length === 8) {
                const year = dateStr.substring(0, 4);
                const month = parseInt(dateStr.substring(4, 6));
                const day = parseInt(dateStr.substring(6, 8));
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                formattedDate = `${monthNames[month - 1]} ${day}`;
            }
            
            return {
                date: formattedDate,
                fullDate: dateStr,
                clicks: parseInt(row.metricValues?.[0]?.value || "0"),
            };
        }) || [];

        return NextResponse.json({
            pages,
            devices,
            countries,
            trend,
            totalClicks,
            totalUsers,
            detectionMethod,
            message: totalClicks === 0 ? "No AI Overview traffic detected. Make sure GTM tracking is set up." : undefined
        });

    } catch (error: any) {
        console.error("AI Overview Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}