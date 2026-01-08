import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Target Brands API - GET.
 * Fetches the list of all target brands (competitors or self) tracked in the workspace.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const targets = await TargetBrand.find({ workspaceId });
    return NextResponse.json(targets, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Error fetching target brands." }, { status: 500 });
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

    const { brand_name, official_url, actual_brand_name, brand_type, brand_description, mainBrand } = await req.json();

    const existing = await TargetBrand.findOne({ brand_name, workspaceId });
    if (existing) {
      return NextResponse.json({ message: "Target brand already exists in this workspace" }, { status: 400 });
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
    console.log(e);
    return NextResponse.json({ message: "Error creating target brand" }, { status: 500 });
  }
}
