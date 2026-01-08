import mongoose from "mongoose";
import { migrateToWorkspaces } from "./migrate-workspaces";

const MONGO_URL = process.env.MONGO_URL!;

if (!MONGO_URL) {
  throw new Error("Please define the MONGO_URL environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to the MongoDB database.
 * Uses a caching strategy to reuse connections in serverless/dev environments.
 */
export async function connectDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Initialize connection and run migrations
    cached.promise = mongoose.connect(MONGO_URL, opts).then(async (mongoose) => {
      console.log("Database Connected");
      await migrateToWorkspaces();
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
