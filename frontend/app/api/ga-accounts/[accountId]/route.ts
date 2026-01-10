import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

// GET specific GA account with tokens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    await connectDatabase();

    const { accountId } = await params;
    const account = await GAAccount.findOne({ _id: accountId, workspaceId });

    if (!account || !account.isActive) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error("Failed to fetch GA account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account", details: error.message },
      { status: 500 }
    );
  }
}


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const body = await req.json();

    const { propertyId, propertyName } = body;
    if (!propertyId || !propertyName) {
      return NextResponse.json(
        { error: "Property ID and Property Name are required" },
        { status: 400 }
      )
    }
    await connectDatabase();
    const { accountId } = await params;
    const updatedAccount = await GAAccount.findOneAndUpdate(
      { _id: accountId, workspaceId },
      {
        propertyId,
        propertyName,
        aiAudienceId: null,
        aiAudienceName: null,

      },
      { new: true }
    );
    if (!updatedAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error("Failed to update GA account:", error);
    return NextResponse.json(
      { error: "Failed to update account", details: error.message },
      { status: 500 }
    );
  }
}