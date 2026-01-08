import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { executePromptTask } from "@/lib/services/cronSchedule";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Execute All Prompts API - POST.
 * Triggers an immediate execution for all scheduled prompts in the workspace.
 * Used for testing or manual overrides of the schedule.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    // Get all scheduled prompts for THIS workspace
    const prompts = await Prompt.find({ isActive: true, isScheduled: true, workspaceId });

    if (prompts.length === 0) {
      return NextResponse.json({
        message: "No scheduled prompts to execute"
      }, { status: 200 });
    }

    // Execute all scheduled prompts
    const executions = prompts.map(prompt =>
      executePromptTask(prompt._id.toString())
    );

    // Don't wait for completion (they run in background)
    Promise.all(executions).catch(err =>
      console.error("Error executing prompts:", err)
    );

    return NextResponse.json({
      message: `Started execution for ${prompts.length} prompt(s)`,
      count: prompts.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error in manual execution:', error);
    return NextResponse.json({
      message: "Failed to execute prompts"
    }, { status: 500 });
  }
}
