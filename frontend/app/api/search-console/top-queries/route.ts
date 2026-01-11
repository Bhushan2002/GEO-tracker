import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Search Console Top Queries API - Fetch query-level data for table
 */

async function refreshTokenIfNeeded(account: any) {
    const now = new Date();
    if (account.expiresAt > now) return account.accessToken;

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
        const startDate = searchParams.get('startDate') || '30daysAgo';
        const endDate = searchParams.get('endDate') || 'today';

        if (!accountId) {
            return NextResponse.json({ error: "Account ID required" }, { status: 400 });
        }

        await connectDatabase();
        const workspaceId = await getWorkspaceId(request);
        if (!workspaceId) return workspaceError();

        const account = await GAAccount.findOne({ _id: accountId, workspaceId });
        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        if (!account.searchConsoleSiteUrl) {
            return NextResponse.json({
                error: "Search Console not linked"
            }, { status: 400 });
        }

        const accessToken = await refreshTokenIfNeeded(account);
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const searchconsole = google.searchconsole({
            version: 'v1',
            auth: oauth2Client,
        });

        // Convert GA date format to Search Console format
        const formatDate = (dateStr: string) => {
            if (dateStr === 'today') {
                return new Date().toISOString().split('T')[0];
            }
            if (dateStr.endsWith('daysAgo')) {
                const days = parseInt(dateStr.replace('daysAgo', ''));
                const date = new Date();
                date.setDate(date.getDate() - days);
                return date.toISOString().split('T')[0];
            }
            return dateStr;
        };

        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        const limit = parseInt(searchParams.get('limit') || '100');

        // Fetch data grouped by QUERY (not date)
        const response = await searchconsole.searchanalytics.query({
            siteUrl: account.searchConsoleSiteUrl,
            requestBody: {
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                dimensions: ['query'],  // ← GROUP BY QUERY for table
                dimensionFilterGroups: [
                    {
                        groupType: 'and',
                        filters: [
                            {
                                dimension: 'query',
                                operator: 'includingRegex',
                                expression: '^(\\S+\\s){3,}\\S+$',  // 4+ words filter
                            },
                        ],
                    },
                ],
                rowLimit: limit,
                dataState: 'final',
            },
        });

        // Format response for table
        const queries = response.data.rows?.map((row: any) => ({
            query: row.keys?.[0] || '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
        })) || [];

        return NextResponse.json({
            queries,
        });

    } catch (error: any) {
        console.error('Search Console Top Queries API Error:', error);
        return NextResponse.json({
            error: error.message,
            details: error.response?.data || 'No additional details'
        }, { status: 500 });
    }
}