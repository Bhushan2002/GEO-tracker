import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { executePromptTask } from "@/lib/services/cronSchedule";
import { Prompt } from "@/lib/models/prompt.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    await connectDatabase();

    // Check if prompt belongs to workspace before starting task
    const prompt = await Prompt.findOne({ _id: id, workspaceId });
    if (!prompt) {
      return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
    }

    executePromptTask(id);
    return NextResponse.json({ message: "Extraction started" }, { status: 200 });
  } catch (error) {
    console.error('Error in run:', error);
    return NextResponse.json({ message: "Failed to start extraction" }, { status: 500 });
  }
}
