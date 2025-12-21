import mongoose = require("mongoose");

export interface IModelResponse{
promptRunId: mongoose.Types.ObjectId;
  modelName: string;
  responseText: string;
  latencyMs?: number;
  identifiedBrands: mongoose.Types.ObjectId;
  tokenUsage?: object;
  error?: string;

};
