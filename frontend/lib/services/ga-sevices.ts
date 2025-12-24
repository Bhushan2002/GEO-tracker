import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Validate environment variables
if (!process.env.GA_CLIENT_EMAIL) {
    console.error("GA_CLIENT_EMAIL environment variable is not set");
}

if (!process.env.GA_PRIVATE_KEY) {
    console.error("GA_PRIVATE_KEY environment variable is not set");
}

if (!process.env.GA_PROPERTY_ID) {
    console.error("GA_PROPERTY_ID environment variable is not set");
}

const credentials = {
    client_email: process.env.GA_CLIENT_EMAIL || "",
    private_key: (process.env.GA_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

export const adminClient = new AnalyticsAdminServiceClient({credentials});

export const dataClient = new BetaAnalyticsDataClient({credentials});
export const propertyPath = `properties/${process.env.GA_PROPERTY_ID}`;
