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
    console.error("API Error:", errorMsg);
    return Promise.reject(error);
  }
);