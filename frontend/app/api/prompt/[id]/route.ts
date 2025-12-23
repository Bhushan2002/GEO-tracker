import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler, executePromptTask } from "@/lib/services/cronSchedule";

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
    const prompt = await Prompt.findById(id);
    if (!prompt) {
      return NextResponse.json({ message: "Prompt not found" }, { status: 404 });
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
    const updatedPrompt = await Prompt.findByIdAndUpdate(id, body, { new: true });
    if (!updatedPrompt) {
      return NextResponse.json({ message: "Prompt not found" }, { status: 404 });
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
    
    if (action === 'start-schedule') {
      await Prompt.findByIdAndUpdate(id, { isScheduled: true });
      await initScheduler();
      return NextResponse.json({ message: "Prompt added to daily schedule" }, { status: 200 });
    } else if (action === 'stop-schedule') {
      await Prompt.findByIdAndUpdate(id, { isScheduled: false });
      await initScheduler();
      return NextResponse.json({ message: "Prompt removed from daily schedule" }, { status: 200 });
    } else if (action === 'run') {
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
    const deletedPrompt = await Prompt.findByIdAndDelete(id);
    if (!deletedPrompt) {
      return NextResponse.json({ message: "Prompt not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Prompt deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ message: "Failed to delete prompt" }, { status: 500 });
  }
}
