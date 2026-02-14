import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "./db/mongodb";
import { Workspace } from "./models/workspace.model";
import mongoose from "mongoose";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { workspaceError as standardWorkspaceError } from "./utils/error-response";

export async function getWorkspaceId(req: NextRequest): Promise<mongoose.Types.ObjectId | null> {
    const workspaceId = req.headers.get("x-workspace-id");

    try {
        if (workspaceId && mongoose.Types.ObjectId.isValid(workspaceId)) {
            return new mongoose.Types.ObjectId(workspaceId);
        }

        // REMOVED FALLBACK: Silently falling back to a "default" workspace causes
        // data leakage. If the header is missing, the API should know and handle context appropriately.
        console.warn("getWorkspaceId: Missing or invalid x-workspace-id header.");
        return null;
    } catch (error) {
        console.error("Error fetching/casting workspace ID:", error);
        return null;
    }
}

/**
 * Returns standardized workspace error response
 * @deprecated Use workspaceError from error-response.ts directly
 */
export function workspaceError(reason?: string) {
    return standardWorkspaceError();
}



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

