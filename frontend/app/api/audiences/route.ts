import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Validate credentials exist
    if (
      !process.env.GA_CLIENT_EMAIL ||
      !process.env.GA_PRIVATE_KEY ||
      !process.env.GA_PROPERTY_ID
    ) {
      return NextResponse.json(
        { error: "Google Analytics credentials are not properly configured" },
        { status: 503 }
      );
    }

    // Format private key
    let privateKey = process.env.GA_PRIVATE_KEY;
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    const adminClient = new AnalyticsAdminServiceClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: privateKey,
      },
    });

    const propertyPath = `properties/${process.env.GA_PROPERTY_ID}`;

    // List all audiences
    const [audiences] = await adminClient.listAudiences({
      parent: propertyPath,
    });

    // Format the response
    const formattedAudiences = audiences.map((audience) => ({
      name: audience.name,
      displayName: audience.displayName,
      description: audience.description,
      membershipDurationDays: audience.membershipDurationDays,
      createdAt: audience.createTime,
    }));

    return NextResponse.json(formattedAudiences);
  } catch (error: any) {
    console.error("List Audiences Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}