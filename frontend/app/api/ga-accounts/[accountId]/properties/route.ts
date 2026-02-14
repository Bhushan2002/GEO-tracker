import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { google } from "googleapis";
import { analyticsadmin } from "googleapis/build/src/apis/analyticsadmin";
import { NextRequest, NextResponse } from "next/server";
import { refreshTokenIfNeeded } from "@/lib/services/oauth-token-refresh";

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