import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { SearchConsoleAccount } from "@/lib/models/searchConsoleAccount.model";

/**
 * OAuth2 Callback Handler for Google Search Console
 * Creates a new SearchConsoleAccount with independent tokens
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state"); // workspaceId
        const error = searchParams.get("error");

        if (error) {
            console.error("OAuth error:", error);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/analytics?error=oauth_failed`
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/analytics?error=missing_params`
            );
        }

        const workspaceId = state;

        // Exchange authorization code for tokens
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GA_CLIENT_ID,
            process.env.GA_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/search-console`
        );

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error("Failed to obtain tokens from Google");
        }

        // Connect to database
        await connectDatabase();

        // Create or update SearchConsoleAccount
        await SearchConsoleAccount.findOneAndUpdate(
            { workspaceId, isActive: true },
            {
                workspaceId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
                isActive: true,
                siteUrl: null, // Will be set during property selection
                verified: false, // Will be set when property is selected
            },
            { upsert: true, new: true }
        );

        console.log("✅ Search Console account connected successfully");

        // Redirect back to analytics page with success flag
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL}/analytics?gsc_connected=true`
        );
    } catch (error: any) {
        console.error("Search Console OAuth callback error:", error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL}/analytics?error=gsc_connection_failed`
        );
    }
}
