
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { ModelResponse } from "@/lib/models/modelResponse.model";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDatabase();

        const count = await ModelResponse.countDocuments();
        const models = await ModelResponse.distinct("modelName");
        const workspaces = await ModelResponse.distinct("workspaceId");

        const sample = await ModelResponse.findOne().select("modelName workspaceId createdAt");

        return NextResponse.json({
            count,
            models,
            workspaces,
            sample
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
