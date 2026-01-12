import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get("accountId");

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
        const dateRanges = [{ startDate: "30daysAgo", endDate: "today" }];
        const dimensionFilter = {
            filter: {
                fieldName: "eventName",
                stringFilter: {
                    matchType: "EXACT",
                    value: "ai_overview_click", 
                },
            },
        };

        // 1. Fetch Top Landing Pages for AI Overviews
        const pagesRes = await analyticsData.properties.runReport({
            property,
            requestBody: {
                dateRanges,
                dimensions: [{ name: "landingPagePlusQueryString" }, { name: "pageTitle" }],
                metrics: [{ name: "eventCount" }],
                dimensionFilter,
                orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
                limit: '10',
            },
        });

        // 2. Fetch Device Category for AI Overviews
        const devicesRes = await analyticsData.properties.runReport({
            property,
            requestBody: {
                dateRanges,
                dimensions: [{ name: "deviceCategory" }],
                metrics: [{ name: "eventCount" }],
                dimensionFilter,
            },
        });

        const pages = pagesRes.data.rows?.map((row: any) => ({
            path: row.dimensionValues?.[0]?.value || "(not set)",
            title: row.dimensionValues?.[1]?.value || "(not set)",
            clicks: parseInt(row.metricValues?.[0]?.value || "0"),
        })) || [];

        const devices = devicesRes.data.rows?.map((row: any) => ({
            name: row.dimensionValues?.[0]?.value || "unknown",
            value: parseInt(row.metricValues?.[0]?.value || "0"),
        })) || [];

        // Calculate total clicks for debugging
        const totalClicks = pages.reduce((sum, page) => sum + page.clicks, 0);

        console.log("AI Overview Stats Debug:", {
            totalPages: pages.length,
            totalClicks,
            hasRows: !!pagesRes.data.rows,
            rowCount: pagesRes.data.rows?.length || 0
        });

        return NextResponse.json({ pages, devices, totalClicks });

    } catch (error: any) {
        console.error("AI Overview Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}