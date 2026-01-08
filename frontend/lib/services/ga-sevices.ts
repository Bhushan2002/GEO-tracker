import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// --- Environment Validation ---
// Ensure critical GA credentials exists before initialization to prevent runtime crashes later.

if (!process.env.GA_CLIENT_EMAIL) {
    console.error("[Config Error] GA_CLIENT_EMAIL environment variable is not set");
}

if (!process.env.GA_PRIVATE_KEY) {
    console.error("[Config Error] GA_PRIVATE_KEY environment variable is not set");
}

if (!process.env.GA_PROPERTY_ID) {
    console.error("[Config Error] GA_PROPERTY_ID environment variable is not set");
}

// --- Client Initialization ---

// Sanitize private key: Google Cloud keys often have literal \n characters that need parsing
const credentials = {
    client_email: process.env.GA_CLIENT_EMAIL || "",
    private_key: (process.env.GA_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

// Admin Client: Used for managing accounts, properties, and audiences
export const adminClient = new AnalyticsAdminServiceClient({ credentials });

// Data Client: Used for fetching analytics reports and timeseries data
export const dataClient = new BetaAnalyticsDataClient({ credentials });

// Default property path helper
export const propertyPath = `properties/${process.env.GA_PROPERTY_ID}`;
