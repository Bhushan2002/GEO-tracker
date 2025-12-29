import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";

// GET all GA accounts
export async function GET() {
  try {
    await connectDatabase();
    
    const accounts = await GAAccount.find({ isActive: true })
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

// DELETE a GA account
export async function DELETE(request: NextRequest) {
  try {
    await connectDatabase();
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }
    
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
