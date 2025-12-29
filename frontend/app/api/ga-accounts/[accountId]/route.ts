import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";

// GET specific GA account with tokens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    await connectDatabase();
    
    const { accountId } = await params;
    const account = await GAAccount.findById(accountId);
    
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
