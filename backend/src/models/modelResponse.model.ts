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
    error: {type: String}
  },
  { timestamps: true }
);
export const ModelResponse = mongoose.model(
  "ModelResponse",
  modelResponseSchema
);
