import axios, { InternalAxiosRequestConfig } from 'axios';



const url  = process.env.SERVER_URL || "https://geo-tracker-001.onrender.com"
export const api = axios.create(
    {
        baseURL: url ,
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