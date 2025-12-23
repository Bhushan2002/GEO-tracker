import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { BetaAnalyticsDataClient } from "@google-analytics/data";



const credentials = {
    client_email: process.env.GA_CLIENT_EMAIL!,
    private_key: process.env.GA_PRIVATE_KEY!.replace(/\\n/g, "\n"),

};


export const adminClient = new AnalyticsAdminServiceClient({credentials});

export const dataClient = new BetaAnalyticsDataClient({credentials})
export const propertyPath = `properties/${process.env.GA_PROPERTY_ID}`;
