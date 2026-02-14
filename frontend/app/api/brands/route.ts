import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/lib/models/brand.model";
import { getWorkspaceId } from "@/lib/workspace-utils";
import { Vibrant } from "node-vibrant/browser";
import axios from "axios";
import { createBrandSchema, validateRequestBody } from "@/lib/validation/schemas";
import { getPaginationParams, paginateQuery } from "@/lib/utils/pagination";
import { workspaceError, handleValidationError, conflict, handleError } from "@/lib/utils/error-response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extractBrandColor = async (brandName: string): Promise<string> => {
  try {
    const domain = brandName.toLowerCase().replace(/\s+/g, "") + ".com";
    const logoUrl = `https://logo.clearbit.com/${domain}`;

    // 1. Fetch image as buffer
    const response = await axios.get(logoUrl, {
      responseType: "arraybuffer",
      timeout: 3000,
    });
    const buffer = Buffer.from(response.data, "binary");

    // 2. Extract palette
    const palette = await Vibrant.from(buffer).getPalette();

    // 3. Return the best "Vibrant" color, or fallback to others
    // The order represents preference for a "Brand" color
    const swatch =
      palette.Vibrant ||
      palette.DarkVibrant ||
      palette.LightVibrant ||
      palette.Muted ||
      palette.DarkMuted;

    if (swatch) {
      return swatch.hex;
    }
  } catch (error) {
    // console.warn(`Could not extract color for ${brandName}`);
  }

  // Fallback Palette
  const PALETTE = ["#60A5FA", "#34D399", "#818CF8", "#F472B6", "#FB923C"];
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
};

/**
 * Brands API - GET.
 * Fetches all brands associated with the current workspace.
 * Supports pagination via ?page=1&limit=20 query parameters.
 * Sorts by rank and name for consistent display.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(req);
    if (!workspaceId) return workspaceError();

    // Get pagination parameters
    const { page, limit } = getPaginationParams(req);

    // Fetch paginated brands
    const result = await paginateQuery(
      Brand,
      { workspaceId },
      page,
      limit,
      {
        sort: { lastRank: 1, brand_name: 1 }
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return handleError(e, "fetching brands");
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

    const body = await req.json();
    const validation = validateRequestBody(createBrandSchema, body);
    
    if (!validation.success) {
      return handleValidationError(validation.error);
    }
    
    const { brand_name, prominence_score, context, associated_links, color } = validation.data;

    const existingBrand = await Brand.findOne({ brand_name, workspaceId });

    if (existingBrand) {
      return NextResponse.json(
        { message: "Brand already exists in this workspace" },
        { status: 400 }
      );
    }

    // extract color asynchronously
    // const color = await extractBrandColor(brand_name);

    const newBrand = await Brand.create({
      workspaceId,
      brand_name,
      color,
      mentions: 0,
      averageSentiment: "Neutral",
      prominence_score: prominence_score || 0,
      context: context || "",
      associated_links: associated_links || [],
    });

    return NextResponse.json(newBrand, { status: 201 });
  } catch (e) {
    console.error("detecting database error:", e);
    return NextResponse.json(
      { message: "Error creating brand." },
      { status: 500 }
    );
  }
}
