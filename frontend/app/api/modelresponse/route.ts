import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { ModelResponse } from "@/lib/models/modelResponse.model";
import { Brand } from "@/lib/models/brand.model";
import { PromptRun } from "@/lib/models/promptRun.model";
import { Prompt } from "@/lib/models/prompt.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Model Responses API - GET.
 * Fetches raw model responses with populated prompt details and identified brands.
 * Used for detailed analysis views and debugging.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();

    // Force model registration to avoid boilerplate errors with Mongoose
    Brand;
    PromptRun;
    Prompt;

    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const modelResponse = await ModelResponse.find({ workspaceId })
      .populate({
        path: 'identifiedBrands',
        select: 'brand_name mentions prominence_score rank_position sentiment sentiment_score sentiment_text associated_domain'
      })
      .populate({
        path: 'promptRunId',
        populate: {
          path: 'promptId',
          select: 'promptText topic tags'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!modelResponse || modelResponse.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // console.log(`Found ${modelResponse.length} model responses`);

    return NextResponse.json(modelResponse, { status: 200 });
  } catch (err) {
    console.error('Error fetching model responses:', err);
    return NextResponse.json({ message: "Error fetching model responses", error: String(err) }, { status: 400 });
  }
}
