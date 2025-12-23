import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import mongoose from "mongoose";

export async function POST() {
  try {
    await connectDatabase();
    
    console.log('Connected to database:', mongoose.connection.name);
    console.log('Connection string:', mongoose.connection.host);
    
    // Import Brand model to ensure it's registered
    const { Brand: BrandModel } = await import('@/lib/models/brand.model');
    
    // Check model indexes
    const modelIndexes = BrandModel.schema.indexes();
    console.log('Model schema indexes:', modelIndexes);
    
    // Drop indexes and recreate based on current schema
    await BrandModel.collection.dropIndexes();
    console.log('All indexes dropped');
    
    // Sync indexes (create indexes based on current schema without unique: true on lastRank)
    await BrandModel.syncIndexes();
    console.log('Indexes synced with current schema');
    
    // List final indexes
    const Brand = mongoose.connection.collection('brands');
    const indexes = await Brand.listIndexes().toArray();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Indexes recreated successfully',
      modelIndexes: modelIndexes,
      finalIndexes: indexes
    });
  } catch (error: any) {
    console.error('Error managing indexes:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
