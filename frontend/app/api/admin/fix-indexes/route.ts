import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import mongoose from "mongoose";

/**
 * Admin endpoint to fix database indexes
 * This drops the old propertyId_1 unique index that's causing conflicts
 */
export async function POST() {
    try {
        await connectDatabase();

        const db = mongoose.connection.db;
        if (!db) {
            return NextResponse.json({ error: "Database not connected" }, { status: 500 });
        }

        const collection = db.collection('gaaccounts');

        // Get all indexes
        const indexes = await collection.indexes();
        console.log("Current indexes:", indexes);

        // Check if the problematic index exists
        const hasPropertyIdIndex = indexes.some(idx => idx.name === 'propertyId_1');

        if (hasPropertyIdIndex) {
            // Drop the old single-field unique index
            await collection.dropIndex('propertyId_1');
            console.log("✅ Dropped propertyId_1 index");

            return NextResponse.json({
                success: true,
                message: "Index fixed! The propertyId_1 unique index has been removed.",
                remainingIndexes: await collection.indexes()
            });
        } else {
            return NextResponse.json({
                success: true,
                message: "No problematic index found. Everything looks good!",
                currentIndexes: indexes
            });
        }
    } catch (error: any) {
        console.error("Failed to fix indexes:", error);
        return NextResponse.json({
            error: error.message,
            details: "Failed to drop index"
        }, { status: 500 });
    }
}
