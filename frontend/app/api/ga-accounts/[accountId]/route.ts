import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { updateGAAccountSchema, validateRequestBody } from "@/lib/validation/schemas";

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

// PATCH: Update GA account property
// This endpoint allows switching the GA property associated with an account
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const body = await req.json();
    const validation = validateRequestBody(updateGAAccountSchema.extend({
      forceSwitch: z.boolean().optional()
    }), body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    const { propertyId, propertyName, forceSwitch } = validation.data;
    await connectDatabase();
    const { accountId } = await params;

    // IMPORTANT: Check if another account already uses this propertyId in this workspace
    // The DB has a unique compound index on { propertyId: 1, workspaceId: 1 }
    // We must exclude the current account (_id: $ne) to allow updating the same account
    const existingAccount = await GAAccount.findOne({
      workspaceId,
      propertyId,
      _id: { $ne: accountId } // Exclude current account from duplicate check
    });

    if (existingAccount) {
      // If forceSwitch is true, clear the property from the old account first
      if (forceSwitch) {
        console.log(`Force switching property ${propertyId} from ${existingAccount.accountName} to new account`);
        
        // Clear the property from the old account
        await GAAccount.findByIdAndUpdate(existingAccount._id, {
          $unset: { 
            propertyId: 1, 
            propertyName: 1,
            aiAudienceId: 1,
            aiAudienceName: 1
          }
        });
        
        console.log(`Property cleared from ${existingAccount.accountName}`);
      } else {
        // Return conflict error with suggestion to use forceSwitch
        return NextResponse.json(
          { 
            error: "Property already in use", 
            details: `This property is already connected to account: ${existingAccount.accountName}. Would you like to switch it to this account?`,
            conflictingAccountName: existingAccount.accountName,
            conflictingAccountId: existingAccount._id,
            canForceSwitch: true
          },
          { status: 409 }
        );
      }
    }

    const updatedAccount = await GAAccount.findOneAndUpdate(
      { _id: accountId, workspaceId },
      {
        propertyId,
        propertyName,
        // Clear audience data when switching properties as audiences are property-specific
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