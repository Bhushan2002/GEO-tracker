import { api } from "./api";

export const audienceAPI = {
  // Fetch analysis data for the table
  getAudienceAnalysis: async () => {
    return await api.get("/api/audiences/report");
  },

  // Create a new audience
  createAudience: async (audienceData: {
    displayName: string;
    description: string;
    membershipDurationDays: number;
    filterClauses: any[];
  }) => {
    return await api.post("/api/audiences/create", audienceData);
  },
};