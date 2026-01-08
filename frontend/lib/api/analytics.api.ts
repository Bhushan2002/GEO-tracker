import { api } from "./api";

export const analyticsAPI = {
  getAudienceReport: async (accountId: string) => {
    return await api.get(`/api/audiences/report?accountId=${accountId}`);
  },

  getAudienceTimeseries: async (accountId: string) => {
    return await api.get(`/api/audiences/timeseries?accountId=${accountId}`);
  },

  getAiModelsReport: async (accountId: string) => {
    return await api.get(`/api/audiences/ai-models-report?accountId=${accountId}`);
  },

  setupAiAudiences: async (data: any) => {
    return await api.post("/api/audiences/setup-ai", data);
  },

  setupAiModelsAudience: async (accountId: string) => {
    return await api.post(`/api/audiences/setup-ai-models?accountId=${accountId}`);
  },

  listAudiences: async (accountId: string) => {
    return await api.get(`/api/audiences?accountId=${accountId}`);
  },
};
