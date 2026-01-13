import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { SearchConsoleAccount } from "@/lib/models/searchConsoleAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Workspace-specific Search Console Accounts API.
 * Manages Search Console connections independently from GA accounts.
 */

// GET - Fetch Search Console account for current workspace
export async function GET(req: NextRequest) {
    try {
        await connectDatabase();
        const workspaceId = await getWorkspaceId(req);
        if (!workspaceId) return workspaceError();

        const account = await SearchConsoleAccount.findOne({
            workspaceId,
            isActive: true
        }).select('siteUrl verified createdAt');

        return NextResponse.json(account);
    } catch (error: any) {
        console.error("Failed to fetch Search Console account:", error);
        return NextResponse.json(
            { error: "Failed to fetch account", details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Soft delete Search Console account
export async function DELETE(request: NextRequest) {
    try {
        await connectDatabase();
        const workspaceId = await getWorkspaceId(request);
        if (!workspaceId) return workspaceError();

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('id');

        if (!accountId) {
            return NextResponse.json(
                { error: "Account ID is required" },
                { status: 400 }
            );
        }

        // Ensure the account belongs to the current workspace
        const account = await SearchConsoleAccount.findOne({
            _id: accountId,
            workspaceId
        });

        if (!account) {
            return NextResponse.json(
                { error: "Account not found in this workspace" },
                { status: 404 }
            );
        }

        // Perform soft delete
        await SearchConsoleAccount.findByIdAndUpdate(accountId, { isActive: false });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete Search Console account:", error);
        return NextResponse.json(
            { error: "Failed to delete account", details: error.message },
            { status: 500 }
        );
    }
}
