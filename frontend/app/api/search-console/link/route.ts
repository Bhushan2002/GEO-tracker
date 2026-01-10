import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Link a Search Console site to a GA account
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

    const account = await GAAccount.findOneAndUpdate(
      { _id: accountId, workspaceId },
      {
        searchConsoleSiteUrl: siteUrl,
        searchConsoleVerified: true,
      },
      { new: true }
    );

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      account 
    });

  } catch (error: any) {
    console.error('Search Console Link Error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}