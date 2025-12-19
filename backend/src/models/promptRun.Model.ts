import mongoose, { Schema } from "mongoose";
import { IPromptRun } from "../types/promptRun.type";

const PromptRunSchema = new Schema<IPromptRun>(
  {
    promptId: { type: Schema.Types.ObjectId, ref: "Prompt", required: true },
    runAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["RUNNING", "COMPLETED", "FAILED"],
      default: "RUNNING"
    }
  },
  { timestamps: true }
);

export const PromptRun = mongoose.model<IPromptRun>("PromptRun", PromptRunSchema);