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
  (res) => res,
  (error) => {
    const data = error.response?.data;
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