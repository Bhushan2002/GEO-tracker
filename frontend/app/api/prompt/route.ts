import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Prompts API - POST.
 * Creates a new AI prompt configuration.
 * Stores prompt text, topic, tags, and scheduling usage.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const { promptText, topic, tags, ipAddress, schedule } = await req.json();

    const prompt = await Prompt.create({
      workspaceId,
      promptText,
      topic,
      tags,
      ipAddress,
      isActive: true,
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "Error creating prompt" }, { status: 400 });
  }
}

/**
 * Prompts API - GET.
 * Fetches all prompts available in the current workspace.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const prompts = await Prompt.find({ workspaceId });

    return NextResponse.json(prompts || [], { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
