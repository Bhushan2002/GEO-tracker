/**
 * Migration script to fix the lastRank unique index issue
 * This script drops the unique index on lastRank and creates a sparse index instead
 * Run this once to fix the E11000 duplicate key error
 * 
 * Usage: npx tsx scripts/fix-lastrank-index.ts <mongodb-uri>
 * Or set DATABASE_URL environment variable
 */

import mongoose from 'mongoose';

async function fixLastRankIndex() {
  try {
    const mongoUri = process.argv[2] || process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGO_URL;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables (DATABASE_URL, MONGODB_URI, or MONGO_URL)');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const brandsCollection = db.collection('brands');

    // Get existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await brandsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Check if lastRank_1 index exists
    const lastRankIndex = indexes.find(idx => idx.name === 'lastRank_1');
    
    if (lastRankIndex) {
      console.log('\nDropping unique index on lastRank...');
      await brandsCollection.dropIndex('lastRank_1');
      console.log('✓ Index dropped successfully');
    } else {
      console.log('\nNo lastRank_1 index found to drop');
    }

    // Create new sparse index (optional - mongoose will handle this)
    console.log('\nCreating sparse index on lastRank...');
    await brandsCollection.createIndex({ lastRank: 1 }, { sparse: true });
    console.log('✓ Sparse index created successfully');

    console.log('\n✓ Migration completed successfully!');
    console.log('The E11000 duplicate key error should now be resolved.');
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the migration
fixLastRankIndex();
