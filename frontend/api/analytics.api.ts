import { api } from "./api";

export const analyticsAPI = {
  getAudienceReport: async () => {
    return await api.get("/api/audiences/report");
  },

  getAudienceTimeseries: async () => {
    return await api.get("/api/audiences/timeseries");
  },

  setupAiAudiences: async (data: any) => {
    return await api.post("/api/audiences/setup-ai", data);
  },

  listAudiences: async () => {
    return await api.get("/api/audiences");
  },
};
