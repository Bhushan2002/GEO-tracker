import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

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
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    if (action === 'start') {
      const updated = await TargetBrand.findOneAndUpdate(
        { _id: id, workspaceId },
        { isScheduled: true },
        { new: true }
      );
      if (!updated) return NextResponse.json({ message: "Brand not found in this workspace" }, { status: 404 });
      await initScheduler();
      return NextResponse.json({ message: "Brand added to daily schedule" }, { status: 200 });
    } else if (action === 'stop') {
      const updated = await TargetBrand.findOneAndUpdate(
        { _id: id, workspaceId },
        { isScheduled: false },
        { new: true }
      );
      if (!updated) return NextResponse.json({ message: "Brand not found in this workspace" }, { status: 404 });
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
