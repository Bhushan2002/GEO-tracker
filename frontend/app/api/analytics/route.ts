import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('ga_access_token')?.value;
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;
    const propertyId = cookieStore.get('ga_property_id')?.value;
    
    console.log('Analytics API - Access Token present:', !!accessToken);
    console.log('Analytics API - Property ID:', propertyId);
    
    // Try to refresh token if access token is missing
    if (!accessToken && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GA_CLIENT_ID,
          process.env.GA_CLIENT_SECRET,
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

    console.log('Fetching analytics for property:', propertyId);

    // Fetch time series data for chart
    const timeSeriesResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
      }
    });

    const chartData = timeSeriesResponse.data.rows?.map((row: any) => ({
      name: row.dimensionValues?.[0].value,
      users: parseInt(row.metricValues?.[0].value || "0"),
    }));

    // Fetch overall metrics for the same period
    const metricsResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "engagedSessions" },
          { name: "eventCount" }
        ],
      }
    });

    const metrics = {
      activeUsers: parseInt(metricsResponse.data.rows?.[0]?.metricValues?.[0]?.value || "0"),
      engagedSessions: parseInt(metricsResponse.data.rows?.[0]?.metricValues?.[1]?.value || "0"),
      keyEvents: parseInt(metricsResponse.data.rows?.[0]?.metricValues?.[2]?.value || "0"),
    };

    console.log('Analytics data fetched successfully');

    const response = NextResponse.json({ chartData, metrics });
    
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
    console.error("Analytics Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    
    return NextResponse.json({ 
      error: error.message || "Failed to fetch analytics data",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
