import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { getWorkspaceId } from "@/lib/workspace-utils";
import { createPromptSchema, validateRequestBody } from "@/lib/validation/schemas";
import { getPaginationParams, paginateQuery } from "@/lib/utils/pagination";
import { workspaceError, handleValidationError, handleError } from "@/lib/utils/error-response";

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

    const body = await req.json();
    const validation = validateRequestBody(createPromptSchema, body);
    
    if (!validation.success) {
      return handleValidationError(validation.error);
    }
    
    const { promptText, topic, tags, ipAddress, schedule } = validation.data;

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
    return handleError(err, "creating prompt");
  }
}

/**
 * Prompts API - GET.
 * Fetches all prompts available in the current workspace.
 * Supports pagination via ?page=1&limit=20 query parameters.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    // Get pagination parameters
    const { page, limit } = getPaginationParams(req);

    // Fetch paginated prompts
    const result = await paginateQuery(
      Prompt,
      { workspaceId },
      page,
      limit,
      {
        sort: { createdAt: -1 }
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return handleError(e, "fetching prompts");
  }
}
