import axios from 'axios';

// Using Next.js API routes (no external server needed)
const url = '';  // Empty string means same origin (Next.js server)

export const api = axios.create(
    {
        baseURL: url,
        headers:{
            'Content-Type': 'application/json'
        }
    }
);


api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);