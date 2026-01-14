import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
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

    // Get SearchConsoleAccount (accountId is now SearchConsoleAccount._id)
    const account = await SearchConsoleAccount.findOne({
      _id: accountId,
      workspaceId
    });

    if (!account) {
      return NextResponse.json({
        error: "Search Console account not found in this workspace"
      }, { status: 404 });
    }

    // Update siteUrl and verification status
    account.siteUrl = siteUrl;
    account.verified = true;
    await account.save();

    return NextResponse.json({
      success: true,
      account: {
        _id: account._id,
        siteUrl: account.siteUrl,
        verified: account.verified
      }
    });

  } catch (error: any) {
    console.error('Search Console Link Error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}