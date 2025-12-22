import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'PATCH, OPTIONS',
    },
  });
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await connectDatabase();
    const { id } = params;
    await TargetBrand.findByIdAndUpdate(id, { isScheduled: false });
    await initScheduler(); // Refresh the cron tasks
    return NextResponse.json({ message: "Brand removed from daily schedule" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to stop brand schedule" }, { status: 500 });
  }
}
