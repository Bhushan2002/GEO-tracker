import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { SearchConsoleAccount } from "@/lib/models/searchConsoleAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Link a Search Console site to the workspace
 * Creates a separate SearchConsoleAccount using GA OAuth tokens
 */
export async function POST(request: NextRequest) {
  try {
    const { accountId, siteUrl } = await request.json();

    if (!accountId || !siteUrl) {
      return NextResponse.json({
        error: "Account ID and Site URL required"
      }, { status: 400 });
    }

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    // Get GA account to copy OAuth tokens
    const gaAccount = await GAAccount.findOne({ _id: accountId, workspaceId });

    if (!gaAccount) {
      return NextResponse.json({ error: "GA Account not found" }, { status: 404 });
    }

    // Create or update SearchConsoleAccount
    const scAccount = await SearchConsoleAccount.findOneAndUpdate(
      { workspaceId, isActive: true },
      {
        siteUrl,
        verified: true,
        accessToken: gaAccount.accessToken,
        refreshToken: gaAccount.refreshToken,
        expiresAt: gaAccount.expiresAt,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      account: scAccount
    });

  } catch (error: any) {
    console.error('Search Console Link Error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}