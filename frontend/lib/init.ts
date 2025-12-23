import { connectDatabase } from "@/lib/db/mongodb";
import { initScheduler } from "@/lib/services/cronSchedule";

let initialized = false;

export async function initializeBackend() {
  if (initialized) return;
  
  try {
    await connectDatabase();
    await initScheduler();
    initialized = true;
    console.log("Backend services initialized successfully");
  } catch (error) {
    console.error("Failed to initialize backend services:", error);
    throw error;
  }
}

// Don't auto-initialize - let it happen on first API request instead
