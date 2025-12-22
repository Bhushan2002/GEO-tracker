import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;
    await Prompt.findByIdAndUpdate(id, { isScheduled: false });
    // Refresh the scheduler to remove this prompt from the 1:31 AM run
    await initScheduler(); 
    return NextResponse.json({ message: "Prompt removed from daily schedule" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to stop schedule" }, { status: 500 });
  }
}
