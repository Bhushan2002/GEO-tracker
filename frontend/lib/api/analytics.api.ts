import { api } from "./api";

/**
 * Service for fetching Analytics data (Google Analytics & AI performance).
 * Connects to `/api/audiences` endpoints.
 */
export const analyticsAPI = {

  // --- Audience & Traffic Reports ---

  /**
   * Fetches the general audience report for a specific account.
   */
  getAudienceReport: async (accountId: string) => {
    return await api.get(`/api/audiences/report?accountId=${accountId}`);
  },

  /**
   * Fetches time-series data for audience traffic.
   */
  getAudienceTimeseries: async (accountId: string) => {
    return await api.get(`/api/audiences/timeseries?accountId=${accountId}`);
  },

  /**
   * Fetches the specific report for AI Model traffic (ChatGPT, Gemini, etc.).
   */
  getAiModelsReport: async (accountId: string) => {
    return await api.get(`/api/audiences/ai-models-report?accountId=${accountId}`);
  },


  // --- Setup & Configuration ---

  /**
   * Configures a custom AI audience segment in Google Analytics.
   */
  setupAiAudiences: async (data: any) => {
    return await api.post("/api/audiences/setup-ai", data);
  },

  /**
   * Automatically sets up audience segments for known AI models.
   */
  setupAiModelsAudience: async (accountId: string) => {
    return await api.post(`/api/audiences/setup-ai-models?accountId=${accountId}`);
  },

  /**
   * Lists all configured audiences for an account.
   */
  listAudiences: async (accountId: string) => {
    return await api.get(`/api/audiences?accountId=${accountId}`);
  },
};
