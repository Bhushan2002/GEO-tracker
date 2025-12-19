import mongoose from "mongoose";

export interface IPromptRun extends Document {
  promptId: mongoose.Types.ObjectId;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  runAt: Date;
}