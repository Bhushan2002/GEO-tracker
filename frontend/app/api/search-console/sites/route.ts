import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { SearchConsoleAccount } from "@/lib/models/searchConsoleAccount.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

/**
 * List all Search Console sites the user has access to
 */

async function refreshTokenIfNeeded(account: any) {
  const now = new Date();
  if (account.expiresAt > now) return account.accessToken;

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GA_CLIENT_ID,
    process.env.GA_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({ refresh_token: account.refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  account.accessToken = credentials.access_token;
  account.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);
  await account.save();

  return credentials.access_token;
}

export async function GET(request: NextRequest) {
  try {
    await connectDatabase();
    const workspaceId = await getWorkspaceId(request);
    if (!workspaceId) return workspaceError();

    // Fetch tokens from SearchConsoleAccount only (no GA fallback)
    const account = await SearchConsoleAccount.findOne({ workspaceId, isActive: true });

    if (!account) {
      return NextResponse.json({
        error: "Search Console not connected. Please connect your account first."
      }, { status: 404 });
    }

    const accessToken = await refreshTokenIfNeeded(account);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    const response = await searchconsole.sites.list();

    console.log('=== Search Console Sites Debug ===');
    console.log('Response status:', response.status);
    console.log('All sites from Google API:', JSON.stringify(response.data.siteEntry, null, 2));

    // Check if we got a valid response
    if (!response.data || !response.data.siteEntry) {
      console.log('No sites found in response or empty siteEntry');
      return NextResponse.json({
        sites: [],
        message: "No Search Console properties found. Please ensure you have verified properties in Search Console."
      });
    }

    // Filter to only show sites with full permissions (owner level)
    // This excludes sites with limited access like 'siteUnverifiedUser'
    const allSites = response.data.siteEntry || [];
    const filteredSites = allSites.filter((site: any) => {
      const permissionLevel = site.permissionLevel || '';
      const hasFullAccess = permissionLevel === 'siteOwner' || permissionLevel === 'siteFullUser';
      console.log(`Site: ${site.siteUrl} | Permission: ${permissionLevel} | Include: ${hasFullAccess}`);
      return hasFullAccess;
    });

    console.log('Total sites:', allSites.length);
    console.log('Filtered sites (owner/full access only):', filteredSites.length);
    console.log('===================================');

    return NextResponse.json({
      sites: filteredSites,
      totalSites: allSites.length,
      message: filteredSites.length === 0 ? "No properties with sufficient permissions found. You need Owner or Full User access." : undefined
    });

  } catch (error: any) {
    console.error('Search Console Sites Error:', error);
    
    // Check for permission errors
    if (error.message?.includes('permission') || error.code === 403) {
      return NextResponse.json({
        error: "Insufficient permissions to access Search Console properties. Please reconnect with proper permissions.",
        needsReconnect: true
      }, { status: 403 });
    }
    
    return NextResponse.json({
      error: error.message || "Failed to fetch Search Console sites"
    }, { status: 500 });
  }
}