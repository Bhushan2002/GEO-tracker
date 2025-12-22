import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    await connectDatabase();
    await TargetBrand.findByIdAndUpdate(id, { isScheduled: false });
    await initScheduler();
    return NextResponse.json({ message: "Brand removed from daily schedule" }, { status: 200 });
  } catch (error) {
    console.error('Error in schedule-stop:', error);
    return NextResponse.json({ message: "Failed to stop brand schedule" }, { status: 500 });
  }
}
