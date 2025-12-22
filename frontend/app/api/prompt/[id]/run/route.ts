import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { executePromptTask } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    await connectDatabase();
    executePromptTask(id); 
    return NextResponse.json({ message: "Extraction started" }, { status: 200 });
  } catch (error) {
    console.error('Error in run:', error);
    return NextResponse.json({ message: "Failed to start extraction" }, { status: 500 });
  }
}
