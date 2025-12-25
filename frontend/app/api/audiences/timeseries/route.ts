import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('ga_access_token')?.value;
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;
    const propertyId = cookieStore.get('ga_property_id')?.value;
    
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
      return NextResponse.json(
        { error: "Not authenticated. Please connect Google Analytics first." },
        { status: 401 }
      );
    }

    // Use user's OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    console.log(`Fetching timeseries data for property: ${propertyId}`);

    // Execute the report request for time series by audience
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [
          { name: "date" },
          { name: "audienceName" }
        ],
        metrics: [
          { name: "activeUsers" }
        ],
      }
    });

    console.log(`Response received with ${response.data.rows?.length || 0} rows`);

    // Transform the data into a format suitable for multi-line chart
    const dataByDate: { [key: string]: any } = {};
    const audiences = new Set<string>();

    response.data.rows?.forEach((row: any) => {
      const date = row.dimensionValues?.[0]?.value || "";
      const audience = row.dimensionValues?.[1]?.value || "All Users";
      const users = parseInt(row.metricValues?.[0]?.value || "0");

      audiences.add(audience);

      if (!dataByDate[date]) {
        dataByDate[date] = { date };
      }
      dataByDate[date][audience] = users;
    });

    const chartData = Object.values(dataByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    console.log(`Processed ${chartData.length} data points for ${audiences.size} audiences`);
    console.log(`Audiences found: ${Array.from(audiences).join(', ')}`);

    const result = NextResponse.json({
      chartData,
      audiences: Array.from(audiences)
    });
    
    // Update access token cookie if it was refreshed
    if (accessToken && !cookieStore.get('ga_access_token')?.value) {
      result.cookies.set('ga_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
      });
    }

    return result;
  } catch (error: any) {
    console.error("Audience Timeseries Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch audience timeseries data",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
