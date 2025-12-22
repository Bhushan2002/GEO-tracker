import mongoose from "mongoose";

export interface IModelResponse {
  promptRunId: mongoose.Types.ObjectId;
  modelName: string;
  responseText: string;
  latencyMs?: number;
  identifiedBrands: mongoose.Types.ObjectId;
  tokenUsage?: object;
  error?: string;
  aeo_geo_insights: {
    share_of_voice_ranking: string[];
    citation_transparency_score: number;
    recommendation_bias: string;
  };
}
