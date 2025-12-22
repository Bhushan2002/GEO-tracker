import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { executePromptTask } from "@/lib/services/cronSchedule";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;
   
    executePromptTask(id); 
    return NextResponse.json({ message: "Extraction started" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to start extraction" }, { status: 500 });
  }
}
