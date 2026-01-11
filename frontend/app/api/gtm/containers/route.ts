import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getGtmClient } from "@/lib/services/gtm-service";

export async function GET(req: NextRequest) {
    try {
        await connectDatabase();
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId'); // Our DB ID for the GA Account

        const gaAccount = await GAAccount.findById(accountId);
        if (!gaAccount) return NextResponse.json({ error: "Account not found" }, { status: 404 });

        const tagmanager = getGtmClient(gaAccount.accessToken, gaAccount.refreshToken);

        // 1. List GTM Accounts
        const accountsRes = await tagmanager.accounts.list();
        const accounts = accountsRes.data.account || [];

        // 2. Fetch Containers for each account (Simplified)
        // In production, you might want to let user pick Account first, then Container.
        const containerOptions = [];

        for (const acc of accounts) {
            try {
                // Note: Use 'path' style parent: accounts/{accountId}
                const containers = await tagmanager.accounts.containers.list({
                    parent: `accounts/${acc.accountId}`
                });

                if (containers.data.container) {
                    for (const c of containers.data.container) {
                        containerOptions.push({
                            gtmAccountId: acc.accountId,
                            gtmAccountName: acc.name,
                            containerId: c.containerId,
                            name: c.name,
                            publicId: c.publicId,
                            path: c.path // Store the full path for easier API calls later
                        });
                    }
                }
            } catch (e) { console.log(`Skipping account ${acc.accountId} due to error`); }
        }

        return NextResponse.json(containerOptions);
    } catch (error: any) {
        console.error("GTM List Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}