import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { getWorkspaceId } from "@/lib/workspace-utils";
import { createTargetBrandSchema, validateRequestBody } from "@/lib/validation/schemas";
import { getPaginationParams, paginateQuery } from "@/lib/utils/pagination";
import { workspaceError, handleValidationError, conflict, handleError } from "@/lib/utils/error-response";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Target Brands API - GET.
 * Fetches the list of all target brands (competitors or self) tracked in the workspace.
 * Supports pagination via ?page=1&limit=20 query parameters.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    // Get pagination parameters
    const { page, limit } = getPaginationParams(req);

    // Fetch paginated target brands
    const result = await paginateQuery(
      TargetBrand,
      { workspaceId },
      page,
      limit,
      {
        sort: { createdAt: -1 }
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return handleError(e, "fetching target brands");
  }
}

/**
 * Target Brands API - POST.
 * adds a new target brand to the workspace for monitoring.
 * Checks for duplicates before creation.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const body = await req.json();
    const validation = validateRequestBody(createTargetBrandSchema, body);
    
    if (!validation.success) {
      return handleValidationError(validation.error);
    }
    
    const { brand_name, official_url, actual_brand_name, brand_type, brand_description, mainBrand } = validation.data;

    const existing = await TargetBrand.findOne({ brand_name, workspaceId });
    if (existing) {
      return conflict("Target brand already exists in this workspace", {
        details: { brandName: brand_name }
      });
    }

    const newTarget = await TargetBrand.create({
      workspaceId,
      brand_name,
      official_url,
      actual_brand_name,
      brand_type,
      brand_description,
      mainBrand: mainBrand || false,
    });
    return NextResponse.json(newTarget, { status: 201 });
  } catch (e) {
    return handleError(e, "creating target brand");
  }
}
