import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Google Analytics Accounts API.
 * Fetches the list of GA accounts and properties accessible by the authenticated user.
 * Handles token management, including automatic access token refreshing using the refresh token.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ga_access_token')?.value;
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;

    console.log('Accounts API - Access Token present:', !!accessToken);
    console.log('Accounts API - Refresh Token present:', !!refreshToken);

    // Scenario: Access token is missing or expired
    if (!accessToken) {
      // Try to refresh the token if we have a refresh token
      if (refreshToken) {
        try {
          const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GA_CLIENT_ID,
            process.env.GA_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
          );

          oauth2Client.setCredentials({
            refresh_token: refreshToken,
          });

          // Request new access token from Google
          const { credentials } = await oauth2Client.refreshAccessToken();
          const newAccessToken = credentials.access_token;

          if (newAccessToken) {
            console.log('Access token refreshed successfully');

            // Use the new token for the request and update the cookie in the response
            const result = await fetchAccountsWithToken(newAccessToken);
            result.cookies.set('ga_access_token', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60, // 1 hour
            });
            return result;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return NextResponse.json(
            { error: "Session expired. Please reconnect Google Analytics." },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { error: "Not authenticated. Please connect Google Analytics first." },
        { status: 401 }
      );
    }

    // Access token is present, proceed with fetching accounts
    return await fetchAccountsWithToken(accessToken);
  } catch (error: any) {
    console.error("List Accounts Error:", error);
    console.error("Error message:", error.message);
    return NextResponse.json({
      error: error.message || "Failed to list accounts",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Helper function to fetch accounts using a valid access token.
 * Retrieves all accounts and iterates through them to fetch their associated properties.
 */
async function fetchAccountsWithToken(accessToken: string) {
  // Configures the OAuth2 client with the provided token
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const admin = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });

  console.log('Fetching Google Analytics accounts...');

  // List all accounts available to the user
  const accountsResponse = await admin.accounts.list();
  const accounts = accountsResponse.data.accounts || [];

  console.log('Accounts found:', accounts.length);

  // For each account, fetch its properties (concurrently for performance)
  const accountsWithProperties = await Promise.all(
    accounts.map(async (account: any) => {
      try {
        const propertiesResponse = await admin.properties.list({
          filter: `parent:${account.name}`,
        });

        const properties = propertiesResponse.data.properties || [];

        return {
          name: account.name,
          displayName: account.displayName,
          createTime: account.createTime,
          updateTime: account.updateTime,
          regionCode: account.regionCode,
          deleted: account.deleted || false,
          properties: properties.map((prop: any) => ({
            name: prop.name,
            displayName: prop.displayName,
            propertyType: prop.propertyType,
            createTime: prop.createTime,
            updateTime: prop.updateTime,
            timeZone: prop.timeZone,
            currencyCode: prop.currencyCode,
            industryCategory: prop.industryCategory,
            propertyId: prop.name?.split('/')[1] || '',
          })),
        };
      } catch (error) {
        console.error(`Error fetching properties for account ${account.name}:`, error);
        // Return partial account data if properties fail to load
        return {
          name: account.name,
          displayName: account.displayName,
          createTime: account.createTime,
          updateTime: account.updateTime,
          regionCode: account.regionCode,
          deleted: account.deleted || false,
          properties: [],
        };
      }
    })
  );

  return NextResponse.json(accountsWithProperties);
}
