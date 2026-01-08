import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/lib/models/brand.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Brands API - GET.
 * Fetches all brands associated with the current workspace.
 * Sorts by rank and name for consistent display.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const brands = await Brand.find({ workspaceId }).sort({ lastRank: 1, brand_name: 1 });

    return NextResponse.json(brands, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Error fetching brands" }, { status: 500 });
  }
}

/**
 * Brands API - POST.
 * Creates a new brand in the workspace if it doesn't already exist.
 * Initializes metrics like mentions, sentiment, and prominence.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    const { brand_name, prominence_score, context, associated_links } = await req.json();

    const existingBrand = await Brand.findOne({ brand_name, workspaceId });

    if (existingBrand) {
      return NextResponse.json({ message: "Brand already exists in this workspace" }, { status: 400 });
    }

    const newBrand = await Brand.create({
      workspaceId,
      brand_name,
      mentions: 0,
      averageSentiment: "Neutral",
      prominence_score: prominence_score || 0,
      context: context || "",
      associated_links: associated_links || [],
    });

    return NextResponse.json(newBrand, { status: 201 });
  } catch (e) {
    console.error("detecting database error:", e);
    return NextResponse.json({ message: "Error creating brand." }, { status: 500 });
  }
}
