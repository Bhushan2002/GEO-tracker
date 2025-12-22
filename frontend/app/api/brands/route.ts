import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Brand } from "@/lib/models/brand.model";

export async function GET() {
  try {
    await connectDatabase();
    const brands = await Brand.find().sort({ lastRank: 1, brand_name: 1 });

    if (!brands || brands.length === 0) {
      return NextResponse.json({ message: "No brand found" }, { status: 404 });
    }
    
    return NextResponse.json(brands, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Error fetching brands" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDatabase();
    const { brand_name, prominence_score, context, associated_links } = await req.json();
    
    const existingBrand = await Brand.findOne({ brand_name });

    if (existingBrand) {
      return NextResponse.json({ message: "Brand already exists" }, { status: 400 });
    }
    
    const newBrand = await Brand.create({ 
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
