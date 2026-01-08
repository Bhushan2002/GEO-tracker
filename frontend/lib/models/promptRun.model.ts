import mongoose, { Schema, models } from "mongoose";
import { IPromptRun } from "../types/promptRun.type";

/**
 * Mongoose Schema for a Prompt Execution Log.
 * Records the status and timestamp of each scheduled or manual prompt run.
 */
const PromptRunSchema = new Schema<IPromptRun>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
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

export const PromptRun = models.PromptRun || mongoose.model<IPromptRun>("PromptRun", PromptRunSchema);
