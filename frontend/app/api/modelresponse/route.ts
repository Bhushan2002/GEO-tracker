import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { ModelResponse } from "@/lib/models/modelResponse.model";
import { Brand } from "@/lib/models/brand.model";
import { PromptRun } from "@/lib/models/promptRun.model";
import { Prompt } from "@/lib/models/prompt.model";
import { getWorkspaceId } from "@/lib/workspace-utils";
import { getPaginationParams, paginateQuery } from "@/lib/utils/pagination";
import { workspaceError, handleError } from "@/lib/utils/error-response";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Model Responses API - GET.
 * Fetches raw model responses with populated prompt details and identified brands.
 * Supports pagination via ?page=1&limit=20 query parameters.
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

    // Get pagination parameters
    const { page, limit } = getPaginationParams(req);

    // Fetch paginated model responses
    const result = await paginateQuery(
      ModelResponse,
      { workspaceId },
      page,
      limit,
      {
        sort: { createdAt: -1 },
        populate: [
          {
            path: 'identifiedBrands',
            select: 'brand_name mentions prominence_score rank_position sentiment sentiment_score sentiment_text associated_domain'
          },
          {
            path: 'promptRunId',
            populate: {
              path: 'promptId',
              select: 'promptText topic tags'
            }
          }
        ],
        lean: true
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return handleError(err, "fetching model responses");
  }
}
