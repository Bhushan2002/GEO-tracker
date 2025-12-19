import mongoose, { Schema } from "mongoose";
import { IModelResponse } from "../types/modelResponse.type";


const modelResponseSchema = new mongoose.Schema<IModelResponse>(
   {
    promptRunId: {
      type: Schema.Types.ObjectId,
      ref: "PromptRun",
      required: true
    },
    modelName: { type: String, required: true },
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
