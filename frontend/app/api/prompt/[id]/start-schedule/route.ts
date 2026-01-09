import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler } from "@/lib/services/cronSchedule";
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
    const result = await Prompt.findOneAndUpdate({ _id: id, workspaceId }, { isScheduled: true });
    if (!result) {
      return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
    }

    await initScheduler();
    return NextResponse.json({ message: "Prompt added to daily schedule" }, { status: 200 });
  } catch (error) {
    console.error('Error in start-schedule:', error);
    return NextResponse.json({ message: "Failed to update schedule" }, { status: 500 });
  }
}
