import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "./db/mongodb";
import { Workspace } from "./models/workspace.model";
import mongoose from "mongoose";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export async function getWorkspaceId(req: NextRequest): Promise<mongoose.Types.ObjectId | null> {
    const workspaceId = req.headers.get("x-workspace-id");

    try {
        if (workspaceId && mongoose.Types.ObjectId.isValid(workspaceId)) {
            return new mongoose.Types.ObjectId(workspaceId);
        }

        // Fallback: Get the default workspace ID
        await connectDatabase();
        let defaultWs = await Workspace.findOne({ isDefault: true });

        // Final fallback: just get any active workspace
        if (!defaultWs) {
            defaultWs = await Workspace.findOne({ isActive: true });
            if (defaultWs) {
                console.warn(`getWorkspaceId: No default found, falling back to workspace: ${defaultWs.name}`);
            }
        }

        if (!defaultWs) {
            console.error("getWorkspaceId: No active workspaces found in database.");
        }

        return defaultWs ? defaultWs._id : null;
    } catch (error) {
        console.error("Error fetching/casting workspace ID:", error);
        return null;
    }
}

export function workspaceError(reason?: string) {
    return NextResponse.json(
        { message: reason || "Valid Workspace ID is required" },
        { status: 400 }
    );
}



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

