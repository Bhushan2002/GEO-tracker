import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;
    await TargetBrand.findByIdAndUpdate(id, { isScheduled: false });
    await initScheduler(); // Refresh the cron tasks
    return NextResponse.json({ message: "Brand removed from daily schedule" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to stop brand schedule" }, { status: 500 });
  }
}
