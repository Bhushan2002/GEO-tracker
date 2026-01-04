import axios from 'axios';

// Using Next.js API routes (no external server needed)
const url = '';  // Empty string means same origin (Next.js server)

export const api = axios.create(
  {
    baseURL: url,
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

api.interceptors.request.use((config) => {
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('selectedWorkspaceId') : null;
  if (workspaceId) {
    config.headers['x-workspace-id'] = workspaceId;
  }
  return config;
});


api.interceptors.response.use(
  (res) => {
    const contentType = res.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      return Promise.reject(new Error(`Expected JSON response, but received ${contentType}. (Likely 404 HTML)`));
    }
    return res;
  },
  (error) => {
    const data = error.response?.data;
    const contentType = error.response?.headers?.['content-type'];

    // Defensive check: If we got HTML (like a 404 page), don't try to parse it as JSON
    if (contentType && contentType.includes('text/html')) {
      console.error("API Error: Received HTML instead of JSON. Check the route path.");
      return Promise.reject(new Error("API route not found (404 Error). Please restart the dev server."));
    }

    const errorMsg = data?.message || data?.error || (typeof data === 'string' ? data : null) || error.message;

    // Don't log console.error for 429 (quota) to avoid the dev overlay popping up
    if (error.response?.status !== 429) {
      console.error("API Error:", errorMsg);
    } else {
      console.warn("API Quota Error (Ignored):", errorMsg);
    }

    return Promise.reject(error);
  }
);