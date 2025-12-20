import mongoose = require("mongoose");

export interface IModelResponse{
promptRunId: mongoose.Types.ObjectId;
  modelName: string;
  responseText: string;
  latencyMs?: number;
  tokenUsage?: object;
  error?: string;

};
