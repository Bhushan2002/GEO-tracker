import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    await connectDatabase();
    await Prompt.findByIdAndUpdate(id, { isScheduled: false });
    await initScheduler(); 
    return NextResponse.json({ message: "Prompt removed from daily schedule" }, { status: 200 });
  } catch (error) {
    console.error('Error in stop-schedule:', error);
    return NextResponse.json({ message: "Failed to stop schedule" }, { status: 500 });
  }
}
