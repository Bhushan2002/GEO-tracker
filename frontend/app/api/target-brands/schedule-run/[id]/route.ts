import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDatabase();
    const { id } = params;
    await TargetBrand.findByIdAndUpdate(id, { isScheduled: true });
    await initScheduler(); // Refresh the cron tasks
    return NextResponse.json({ message: "Brand added to daily schedule" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update brand schedule" }, { status: 500 });
  }
}
