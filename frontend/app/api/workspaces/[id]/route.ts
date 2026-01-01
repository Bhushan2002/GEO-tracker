import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Workspace } from "@/lib/models/workspace.model";

export const runtime = 'nodejs';

type Props = {
    params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        await connectDatabase();

        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return NextResponse.json({ message: "Workspace not found" }, { status: 404 });
        }

        if (workspace.isDefault) {
            return NextResponse.json({ message: "Cannot delete the default workspace" }, { status: 400 });
        }

        const workspacesCount = await Workspace.countDocuments({ isActive: true });
        if (workspacesCount <= 1) {
            return NextResponse.json({ message: "Cannot delete the last workspace" }, { status: 400 });
        }

        await Workspace.findByIdAndUpdate(id, { isActive: false });

        return NextResponse.json({ message: "Workspace deleted successfully" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
