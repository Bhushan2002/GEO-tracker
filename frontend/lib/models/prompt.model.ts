import mongoose, { models } from "mongoose";
import { IPrompt } from "../types/prompt.type";

/**
 * Mongoose Schema for the Prompt entity.
 * Represents a user-created prompt configuration to be tracked.
 */
const PromptSchema = new mongoose.Schema<IPrompt>({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },

  promptText: { type: String, required: true },
  topic: { type: String, required: true },

  ipAddress: String,
  tags: [String],

  isScheduled: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
});

export const Prompt = models.Prompt || mongoose.model<IPrompt>("Prompt", PromptSchema);
