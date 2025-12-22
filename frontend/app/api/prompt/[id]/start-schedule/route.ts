import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { initScheduler } from "@/lib/services/cronSchedule";

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
    await Prompt.findByIdAndUpdate(id, { isScheduled: true });
    await initScheduler(); 
    return NextResponse.json({ message: "Prompt added to daily schedule" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update schedule" }, { status: 500 });
  }
}
