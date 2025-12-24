# Google Analytics 500 Error Fix

## Issues Fixed

1. **Client Initialization**: Moved Google Analytics client initialization from module level to request handler level to prevent serverless/edge runtime issues
2. **Environment Variables**: Added proper validation and error messages for missing environment variables
3. **Private Key Formatting**: Ensured consistent handling of newline characters in the private key
4. **Error Logging**: Enhanced error logging to help diagnose issues in production

## Deployment Checklist

### 1. Environment Variables Setup

Make sure these environment variables are set in your deployment platform (Vercel, Netlify, etc.):

```env
GA_PROPERTY_ID=285013867
GA_CLIENT_EMAIL=analyticaldatafetcher@decisive-post-482108-j5.iam.gserviceaccount.com
GA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCp4ZAtdP2BmsE/
...
(your full private key)
...
-----END PRIVATE KEY-----
```

**Important for `GA_PRIVATE_KEY`:**
- On platforms like Vercel: Paste the entire key including BEGIN/END markers
- The newlines should be actual newlines OR escaped as `\n` (the code handles both)
- Do NOT add quotes unless required by your platform

### 2. Testing the Fix

After deployment, check these endpoints:

1. **Analytics Data**: `https://yourdomain.com/api/analytics`
   - Should return array of chart data
   
2. **Audiences List**: `https://yourdomain.com/api/audiences`
   - Should return list of audiences
   
3. **Audience Report**: `https://yourdomain.com/api/audiences/report`
   - Should return audience metrics

### 3. Debugging in Production

If you still see 500 errors:

1. Check your deployment logs for these error messages:
   - "GA_CLIENT_EMAIL environment variable is not set"
   - "GA_PRIVATE_KEY environment variable is not set"
   - "GA_PROPERTY_ID environment variable is not set"
   - "GA_PRIVATE_KEY is not properly formatted"

2. Verify environment variables are correctly set:
   - No extra spaces
   - Private key includes BEGIN and END markers
   - Property ID is numeric only

3. Check Google Analytics API permissions:
   - Service account has "Viewer" role on the GA4 property
   - Google Analytics Data API is enabled in Google Cloud Console
   - Google Analytics Admin API is enabled in Google Cloud Console

### 4. Platform-Specific Notes

#### Vercel
- Set environment variables in Project Settings → Environment Variables
- Redeploy after adding/updating variables
- Use Production, Preview, and Development scopes as needed

#### Netlify
- Set environment variables in Site settings → Environment variables
- Use actual newlines or `\n` escapes
- Trigger a new deployment

#### Other Platforms
- Ensure serverless functions support is enabled
- Check maximum function execution time (GA API calls may take 5-10 seconds)
- Verify Node.js version compatibility (should be 18+)

## Common Issues

### Issue: "Google Analytics credentials are not properly configured"
**Solution**: Environment variables are missing or not loaded. Check your platform's environment variable settings.

### Issue: "invalid_grant" or authentication errors
**Solution**: 
- Verify the service account email is correct
- Ensure the private key is complete and properly formatted
- Check that the service account has access to the GA4 property

### Issue: "Permission denied"
**Solution**: 
- Add the service account email to your GA4 property with at least "Viewer" role
- Enable required APIs in Google Cloud Console

## Files Modified

- `/app/api/analytics/route.ts` - Enhanced error handling and validation
- `/app/api/audiences/route.ts` - Improved error logging
- `/app/api/audiences/report/route.ts` - Fixed client initialization
- `/lib/services/ga-sevices.ts` - Added validation and better error messages

## Testing Locally

Run the development server:
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000/google-analytics`

If it works locally but not in production, it's definitely an environment variable configuration issue on your deployment platform.
