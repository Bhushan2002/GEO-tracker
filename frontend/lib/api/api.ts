import axios from 'axios';

// --- Configuration ---

// Use an empty string for the baseURL to allow the browser to handle the origin.
// This works seamlessly with Next.js API routes served from the same domain.
const BASE_URL = '';

// Create a configured Axios instance for all application API requests
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


// --- Request Interceptors ---

/**
 * Attaches the currently selected Workspace ID to every outgoing request.
 * This ensures the backend knows strictly which workspace context to operate in.
 */
api.interceptors.request.use((config) => {
  // Retrieve workspace ID from local storage (safe for client-side execution)
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('selectedWorkspaceId') : null;

  if (workspaceId) {
    config.headers['x-workspace-id'] = workspaceId;
  }

  return config;
});


// --- Response Interceptors ---

api.interceptors.response.use(
  (res) => {
    // Quality Check: Ensure we received JSON. 
    // Sometimes 404s from Next.js return HTML pages instead of JSON error objects.
    const contentType = res.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      return Promise.reject(new Error(`Expected JSON response, but received ${contentType}. (Likely 404 HTML)`));
    }
    return res;
  },
  (error) => {
    const data = error.response?.data;
    const contentType = error.response?.headers?.['content-type'];

    // Defensive Check: If the server returned HTML (common with unhandled 404/500 errors),
    // prevent parsing it as JSON to avoid confusing "Unexpected token <" errors.
    if (contentType && contentType.includes('text/html')) {
      console.error("API Error: Received HTML instead of JSON. Check the route path.");
      return Promise.reject(new Error("API route not found (404 Error). Please restart the dev server."));
    }

    // Extract the most consistent error message available
    const errorMsg = data?.message || data?.error || (typeof data === 'string' ? data : null) || error.message;

    // Error Logging Strategy
    // 429 Quota errors are expected during high usage, so we demote them to warnings
    // to keep the development console clean.
    if (error.response?.status !== 429) {
      console.error("API Error:", errorMsg);
    } else {
      console.warn("API Quota Error (Ignored):", errorMsg);
    }

    return Promise.reject(error);
  }
);
