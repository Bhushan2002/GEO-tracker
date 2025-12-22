import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";

export async function POST(req: NextRequest) {
  try {
    await connectDatabase();
    const { promptText, topic, tags, ipAddress, schedule } = await req.json();

    const prompt = await Prompt.create({
      promptText,
      topic,
      tags,
      ipAddress,
      isActive: true,
    });
    
    return NextResponse.json(prompt, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "Error creating prompt" }, { status: 400 });
  }
}

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
