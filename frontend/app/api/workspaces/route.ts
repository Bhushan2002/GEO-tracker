import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Workspace } from "@/lib/models/workspace.model";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDatabase();
        let workspaces = await Workspace.find({ isActive: true });

        // Seed default workspace if none exist
        if (workspaces.length === 0) {
            const defaultWorkspace = await Workspace.create({
                name: "Creatosaurus's Workspace",
                type: "Free",
                memberCount: 1,
                isDefault: true,
            });
            return NextResponse.json([defaultWorkspace], { status: 200 });
        }

        // Migration: If no workspace is marked as default, mark the primary one as default
        const hasDefault = workspaces.some(w => w.isDefault);
        if (!hasDefault && workspaces.length > 0) {
            // Find "Creatosaurus's Workspace"
            const primary = workspaces.find(w => w.name === "Creatosaurus's Workspace" || w.name === "My Workspace");
            if (primary) {
                await Workspace.findByIdAndUpdate(primary._id, { isDefault: true });
            } else {
                // Fallback to first one
                await Workspace.findByIdAndUpdate(workspaces[0]._id, { isDefault: true });
            }
            // Refresh list
            workspaces = await Workspace.find({ isActive: true });
        }

        return NextResponse.json(workspaces, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDatabase();
        const { name, type } = await req.json();

        if (!name) {
            return NextResponse.json({ message: "Workspace name is required" }, { status: 400 });
        }

        const workspace = await Workspace.create({
            name,
            type: type || "Free",
            memberCount: 1,
        });

        return NextResponse.json(workspace, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
