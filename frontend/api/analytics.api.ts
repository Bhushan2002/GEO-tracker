import { api } from "./api";

export const analyticsAPI = {
  getAudienceReport: async () => {
    return await api.get("/api/audiences/report");
  },

  getAudienceTimeseries: async () => {
    return await api.get("/api/audiences/timeseries");
  },

  getAiModelsReport: async () => {
    return await api.get("/api/audiences/ai-models-report");
  },

  setupAiAudiences: async (data: any) => {
    return await api.post("/api/audiences/setup-ai", data);
  },

  setupAiModelsAudience: async () => {
    return await api.post("/api/audiences/setup-ai-models");
  },

  listAudiences: async () => {
    return await api.get("/api/audiences");
  },
};
