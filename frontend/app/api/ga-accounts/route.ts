import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * Workspace-specific GA Accounts API.
 * Allows managing Google Analytics accounts linked to a specific workspace.
 */

// GET all GA accounts for the current workspace
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    // Validate workspace context
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const accounts = await GAAccount.find({ workspaceId, isActive: true })
      .select('accountName accountId propertyId propertyName createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error("Failed to fetch GA accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE (soft delete) a GA account from the workspace
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
    const account = await GAAccount.findOne({ _id: accountId, workspaceId });
    if (!account) {
      return NextResponse.json({ error: "Account not found in this workspace" }, { status: 404 });
    }

    // Perform soft delete by setting isActive to false
    await GAAccount.findByIdAndUpdate(accountId, { isActive: false });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete GA account:", error);
    return NextResponse.json(
      { error: "Failed to delete account", details: error.message },
      { status: 500 }
    );
  }
}
