import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler, executePromptTask } from "@/lib/services/cronSchedule";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import { promptActionSchema, validateRequestBody } from "@/lib/validation/schemas";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Prompt Actions API - POST.
 * Handles diverse actions for a prompt: 'start-schedule', 'stop-schedule', 'run'.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(promptActionSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    const { id, action } = validation.data;

    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    if (action === 'start-schedule') {
      const result = await Prompt.findOneAndUpdate({ _id: id, workspaceId }, { isScheduled: true });
      if (!result) return NextResponse.json({ message: "Prompt not found in workspace" }, { status: 404 });
      await initScheduler();
      return NextResponse.json({ message: "Prompt added to daily schedule" }, { status: 200 });

    } else if (action === 'stop-schedule') {
      const result = await Prompt.findOneAndUpdate({ _id: id, workspaceId }, { isScheduled: false });
      if (!result) return NextResponse.json({ message: "Prompt not found in workspace" }, { status: 404 });
      await initScheduler();
      return NextResponse.json({ message: "Prompt removed from daily schedule" }, { status: 200 });

    } else if (action === 'run') {
      // Small check for existence in workspace
      const exists = await Prompt.findOne({ _id: id, workspaceId });
      if (!exists) return NextResponse.json({ message: "Prompt not found in workspace" }, { status: 404 });

      executePromptTask(id);
      return NextResponse.json({ message: "Extraction started" }, { status: 200 });

    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in prompt action:', error);
    return NextResponse.json({ message: "Failed to execute action" }, { status: 500 });
  }
}
