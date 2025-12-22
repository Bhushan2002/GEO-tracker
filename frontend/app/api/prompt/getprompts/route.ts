import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDatabase();
    const prompts = await Prompt.find();
    
    if (!prompts) {
      return NextResponse.json({ message: "unable to fetch prompts" }, { status: 404 });
    }
    
    return NextResponse.json(prompts, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
