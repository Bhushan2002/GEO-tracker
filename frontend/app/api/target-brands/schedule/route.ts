import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;
    
    if (!id || !action) {
      return NextResponse.json({ message: "Missing id or action" }, { status: 400 });
    }
    
    await connectDatabase();
    
    if (action === 'start') {
      await TargetBrand.findByIdAndUpdate(id, { isScheduled: true });
      await initScheduler();
      return NextResponse.json({ message: "Brand added to daily schedule" }, { status: 200 });
    } else if (action === 'stop') {
      await TargetBrand.findByIdAndUpdate(id, { isScheduled: false });
      await initScheduler();
      return NextResponse.json({ message: "Brand removed from daily schedule" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating brand schedule:', error);
    return NextResponse.json({ message: "Failed to update brand schedule" }, { status: 500 });
  }
}
