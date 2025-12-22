import mongoose, { models } from "mongoose";
import { IPrompt } from "../types/prompt.type";

const PromptSchema = new mongoose.Schema<IPrompt>({
  promptText: { type: String, required: true },
  topic: { type: String, required: true },
  ipAddress: String,
  tags: [String],
  isScheduled: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
});

export const Prompt = models.Prompt || mongoose.model<IPrompt>("Prompt", PromptSchema);
