import mongoose from "mongoose";

export interface IPromptRun extends Document {
  workspaceId?: mongoose.Types.ObjectId;
  promptId: mongoose.Types.ObjectId;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  runAt: Date;
}
