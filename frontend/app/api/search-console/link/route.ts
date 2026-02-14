import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { SearchConsoleAccount } from "@/lib/models/searchConsoleAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { linkSearchConsoleSchema, validateRequestBody } from "@/lib/validation/schemas";

/**
 * Link a Search Console site to the workspace
 * Creates a separate SearchConsoleAccount using GA OAuth tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(linkSearchConsoleSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    const { accountId, siteUrl } = validation.data;

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