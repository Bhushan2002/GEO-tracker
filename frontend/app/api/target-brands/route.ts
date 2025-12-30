import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDatabase();
    const targets = await TargetBrand.find();
    return NextResponse.json(targets, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Error fetching target brands." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDatabase();
    const { brand_name, official_url, actual_brand_name, brand_type, brand_description, mainBrand } = await req.json();
    
    const existing = await TargetBrand.findOne({ brand_name });
    if (existing) {
      return NextResponse.json({ message: "Target brand already exists" }, { status: 400 });
    }

    const newTarget = await TargetBrand.create({ 
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
