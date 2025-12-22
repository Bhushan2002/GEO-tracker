import mongoose, { Schema } from "mongoose";
import { IModelResponse } from "../types/modelResponse.type";
import { ref } from "node:process";


const modelResponseSchema = new mongoose.Schema<IModelResponse>(
   {
    promptRunId: {
      type: Schema.Types.ObjectId,
      ref: "PromptRun",
      required: true
    },
    modelName: { type: String, required: true },
    identifiedBrands : [{type: Schema.Types.ObjectId, ref: 'Brand'}],
    responseText: {type: String },
    latencyMs: {type: Number},
    tokenUsage: {type: Object},
    error: {type: String},
     aeo_geo_insights: {
    share_of_voice_ranking: [String],
    citation_transparency_score: Number,
    recommendation_bias: String,
  },
  },
 
  { timestamps: true }
);
export const ModelResponse = mongoose.model(
  "ModelResponse",
  modelResponseSchema
);
