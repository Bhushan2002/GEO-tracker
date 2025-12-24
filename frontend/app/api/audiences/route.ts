import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ga_access_token')?.value;
    const propertyId = cookieStore.get('ga_property_id')?.value;
    
    console.log('Audiences API - Access Token present:', !!accessToken);
    console.log('Audiences API - Property ID:', propertyId);
    
    if (!accessToken || !propertyId) {
      console.error('Missing credentials - accessToken:', !!accessToken, 'propertyId:', propertyId);
      return NextResponse.json(
        { error: "Not authenticated. Please connect Google Analytics first." },
        { status: 401 }
      );
    }

    // Use user's OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Use v1alpha version which has audiences resource
    const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

    console.log('Fetching audiences for property:', propertyId);

    // List all audiences
    const audiencesResponse = await admin.properties.audiences.list({
      parent: `properties/${propertyId}`,
    });
    
    const audiences = audiencesResponse.data.audiences || [];
    
    console.log('Audiences found:', audiences.length);

    // Format the response
    const formattedAudiences = audiences.map((audience: any) => ({
      name: audience.name,
      displayName: audience.displayName,
      description: audience.description,
      membershipDurationDays: audience.membershipDurationDays,
      createdAt: audience.createTime,
    }));

    return NextResponse.json(formattedAudiences);
  } catch (error: any) {
    console.error("List Audiences Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || "Failed to list audiences",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}