import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('ga_access_token')?.value;
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;
    const propertyId = cookieStore.get('ga_property_id')?.value;
    
    console.log('Report API - Access Token present:', !!accessToken);
    console.log('Report API - Property ID:', propertyId);
    
    // Try to refresh token if access token is missing
    if (!accessToken && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GA_CLIENT_ID,
          process.env.NEXT_PUBLIC_GA_CLIENT_SECRET,
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token || undefined;
        console.log('Token refreshed successfully:', !!accessToken);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
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
    
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    console.log('Fetching report for property:', propertyId);

    // Execute the report request
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "audienceName" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "sessionConversionRate" },
          { name: "conversions" }
        ],
      }
    });

    console.log('Report response received with', response.data.rows?.length || 0, 'rows');

    // Transform the raw API response into a clean format
    const formattedRows = response.data.rows?.map((row: any) => ({
      audience: row.dimensionValues?.[0]?.value || "Unknown",
      users: row.metricValues?.[0]?.value || "0",
      sessions: row.metricValues?.[1]?.value || "0",
      conversionRate: `${(parseFloat(row.metricValues?.[2]?.value || "0") * 100).toFixed(2)}%`,
      conversions: row.metricValues?.[3]?.value || "0",
    }));

    const response = NextResponse.json(formattedRows || []);
    
    // Update access token cookie if it was refreshed
    if (accessToken && !cookieStore.get('ga_access_token')?.value) {
      response.cookies.set('ga_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Audience Report Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch audience report",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}