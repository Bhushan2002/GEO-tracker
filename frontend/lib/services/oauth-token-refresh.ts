import { google } from "googleapis";
import { GAAccount } from "@/lib/models/gaAccount.model";
import { SearchConsoleAccount } from "@/lib/models/searchConsoleAccount.model";

/**
 * OAuth Token Refresh Utility
 
 * Centralized Google OAuth token management for Google Analytics and Search Console apis
 */

// TYPE DEFINITIONS

export interface OAuthAccount {
  refreshToken: string;
  accessToken?: string;
  expiresAt?: Date;
  save: () => Promise<any>;
}

/**
 * Options for creating OAuth2 client
 */
interface OAuth2ClientOptions {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}


// CONFIGURATION


/**
 * Default OAuth configuration from environment variables
 */
const DEFAULT_OAUTH_CONFIG: OAuth2ClientOptions = {
  clientId: process.env.NEXT_PUBLIC_GA_CLIENT_ID,
  clientSecret: process.env.GA_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`,
};

/**
 * Token expiry buffer - refresh 5 minutes before actual expiry
 * This prevents race conditions where token expires during API call
 */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Default token lifetime if Google doesn't provide expiry
 */
const DEFAULT_TOKEN_LIFETIME_MS = 3600 * 1000; // 1 hour



// CORE FUNCTIONS



/**
 * Creates and configures a Google OAuth2 client
 */
export function createOAuth2Client(
  options: OAuth2ClientOptions = {},
): InstanceType<typeof google.auth.OAuth2> {
  const config = { ...DEFAULT_OAUTH_CONFIG, ...options };

  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );
}

/**
 * Checks if an access token is expired or will expire soon
 */
export function isTokenExpired(
  expiresAt: Date | undefined,
  bufferMs: number = TOKEN_EXPIRY_BUFFER_MS,
): boolean {
  if (!expiresAt) return true;

  const now = new Date();
  const expiryWithBuffer = new Date(expiresAt.getTime() - bufferMs);

  return now >= expiryWithBuffer;
}

/**
 * Refreshes OAuth access token if needed and updates account in database
 *
 * This is the main function used by all API routes. It:
 * 1. Checks if token is still valid
 * 2. If expired, refreshes using refresh token
 * 3. Updates account in database with new token
 * 4. Returns valid access token
 */
export async function refreshTokenIfNeeded(
  account: OAuthAccount,
  options: OAuth2ClientOptions = {},
): Promise<string> {
  // Check if current token is still valid
  if (!isTokenExpired(account.expiresAt) && account.accessToken) {
    return account.accessToken;
  }

  // Token expired or missing - refresh it
  return await refreshAccessToken(account, options);
}

/**
 * Forces a refresh of the OAuth access token
 *
 * Use this when you need to force a token refresh regardless of expiry.
 * For normal use, prefer `refreshTokenIfNeeded` which checks expiry first.
 */
export async function refreshAccessToken(
  account: OAuthAccount,
  options: OAuth2ClientOptions = {},
): Promise<string> {
  if (!account.refreshToken) {
    throw new Error("No refresh token available for account");
  }

  const oauth2Client = createOAuth2Client(options);
  oauth2Client.setCredentials({ refresh_token: account.refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("No access token received from Google");
    }

    // Update account with new credentials
    account.accessToken = credentials.access_token;
    account.expiresAt = new Date(
      credentials.expiry_date || Date.now() + DEFAULT_TOKEN_LIFETIME_MS,
    );

    // Persist to database
    await account.save();

    return credentials.access_token;
  } catch (error: any) {
    // Provide more context in error message
    throw new Error(
      `Failed to refresh OAuth token: ${error.message || "Unknown error"}`,
    );
  }
}

// Creates an authenticated OAuth2 client with auto-refreshed token

export async function getAuthenticatedClient(
  account: OAuthAccount,
  options: OAuth2ClientOptions = {},
): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const accessToken = await refreshTokenIfNeeded(account, options);

  const oauth2Client = createOAuth2Client(options);
  oauth2Client.setCredentials({ access_token: accessToken });

  return oauth2Client;
}

/**
 * Validates that an account has the necessary OAuth credentials
 */
export function hasValidOAuthCredentials(
  account: OAuthAccount | null | undefined,
): account is OAuthAccount {
  return !!(account && account.refreshToken);
}

// EXPORTS

export default {
  refreshTokenIfNeeded,
  refreshAccessToken,
  getAuthenticatedClient,
  createOAuth2Client,
  isTokenExpired,
  hasValidOAuthCredentials,
};
