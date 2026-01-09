import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { initScheduler } from "@/lib/services/cronSchedule";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    await connectDatabase();
    const brand = await TargetBrand.findOne({ _id: id, workspaceId });
    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json(brand, { status: 200 });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({ message: "Failed to fetch brand" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const { action } = body; // 'start' or 'stop'

  try {
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    await connectDatabase();

    // Explicitly check workspaceId during update
    const brand = await TargetBrand.findOne({ _id: id, workspaceId });
    if (!brand) {
      return NextResponse.json({ message: "Brand not found in this workspace" }, { status: 404 });
    }

    if (action === 'start') {
      await TargetBrand.updateOne({ _id: id, workspaceId }, { isScheduled: true });
      await initScheduler();
      return NextResponse.json({ message: "Brand added to daily schedule" }, { status: 200 });
    } else if (action === 'stop') {
      await TargetBrand.updateOne({ _id: id, workspaceId }, { isScheduled: false });
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
