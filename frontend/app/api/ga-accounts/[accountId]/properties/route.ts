import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { analyticsadmin } from "googleapis/build/src/apis/analyticsadmin";
import { NextRequest, NextResponse } from "next/server";

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

    // Update token in database
    account.accessToken = credentials.access_token;
    account.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);
    await account.save();

    return credentials.access_token;
}

export async function GET(req: NextRequest, { params }: { params: { accountId: string } }) {
    try {
        const { accountId } = await params;
        await connectDatabase();
        const workspaceId = await getWorkspaceId(req);
        if (!workspaceId) return workspaceError();


        const account = await GAAccount.findOne({ _id: accountId, workspaceId })
        if (!account || !account.isActive) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const accessToken = await refreshTokenIfNeeded(account);

        const oauth2Client = new google.auth.OAuth2();

        oauth2Client.setCredentials({ access_token: accessToken });
        const admin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });

        // List Properties for the stored Account ID
        const response = await admin.properties.list({
            filter: `parent:accounts/${account.accountId}`,
            pageSize: 100,
        });

        const properties = response.data.properties;
        if (!properties) {
            return NextResponse.json({ error: "Properties not found" }, { status: 404 });
        }
        const formattedProperties = properties.map((prop: any) => ({
            id: prop.name.split("/")[1],
            name: prop.displayName,
            createTime: prop.createTime,
        }));
        return NextResponse.json(formattedProperties);

    } catch (error: any) {
        console.error("Failed to fetch properties:", error);
        return NextResponse.json(
            { error: "Failed to fetch properties", details: error.message },
            { status: 500 }
        );
    }
}