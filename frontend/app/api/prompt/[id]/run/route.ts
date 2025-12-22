import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { executePromptTask } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { id: string }
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    await connectDatabase();
    const { id } = context.params;
   
    executePromptTask(id); 
    return NextResponse.json({ message: "Extraction started" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to start extraction" }, { status: 500 });
  }
}
