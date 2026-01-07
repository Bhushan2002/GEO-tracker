import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler, executePromptTask } from "@/lib/services/cronSchedule";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const prompt = await Prompt.findOne({ _id: id, workspaceId });
    if (!prompt) {
      return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
    }
    return NextResponse.json(prompt, { status: 200 });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json({ message: "Failed to fetch prompt" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const updatedPrompt = await Prompt.findOneAndUpdate(
      { _id: id, workspaceId },
      body,
      { new: true }
    );
    if (!updatedPrompt) {
      return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
    }
    return NextResponse.json(updatedPrompt, { status: 200 });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ message: "Failed to update prompt" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const { action } = body; // 'start-schedule', 'stop-schedule', or 'run'

  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    if (action === 'start-schedule') {
      const updated = await Prompt.findOneAndUpdate(
        { _id: id, workspaceId },
        { isScheduled: true },
        { new: true }
      );
      if (!updated) return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
      await initScheduler();
      return NextResponse.json({ message: "Prompt added to daily schedule" }, { status: 200 });
    } else if (action === 'stop-schedule') {
      const updated = await Prompt.findOneAndUpdate(
        { _id: id, workspaceId },
        { isScheduled: false },
        { new: true }
      );
      if (!updated) return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
      await initScheduler();
      return NextResponse.json({ message: "Prompt removed from daily schedule" }, { status: 200 });
    } else if (action === 'run') {
      const prompt = await Prompt.findOne({ _id: id, workspaceId });
      if (!prompt) return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    const deletedPrompt = await Prompt.findOneAndDelete({ _id: id, workspaceId });
    if (!deletedPrompt) {
      return NextResponse.json({ message: "Prompt not found in this workspace" }, { status: 404 });
    }
    return NextResponse.json({ message: "Prompt deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ message: "Failed to delete prompt" }, { status: 500 });
  }
}
