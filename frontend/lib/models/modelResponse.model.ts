import mongoose, { Schema, models } from "mongoose";
import { IModelResponse } from "../types/modelResponse.type";

/**
 * Mongoose Schema for AI Model Responses.
 * Stores the raw output and structured analysis from an AI model (e.g., GPT-4, Gemini)
 * for a specific prompt execution.
 */
const modelResponseSchema = new mongoose.Schema<IModelResponse>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },

    promptRunId: {
      type: Schema.Types.ObjectId,
      ref: "PromptRun",
      required: true
    },

    modelName: { type: String, required: true },

    // References to detail Brand entities created/found during analysis
    identifiedBrands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],

    // Raw output and performance metrics
    responseText: { type: String },
    latencyMs: { type: Number },
    tokenUsage: { type: Object },
    error: { type: String },

    // --- Strategic Analysis Summary ---
    // High-level insights derived from the model's response
    audit_summary: {
      total_brands_detected: Number,
      implied_user_persona: String,
      winning_brand: String,
      winning_factor: [String],
      missing_content_assets: [{
        asset_type: String,
        competitor_example: String,
        priority: String,
        impact: String
      }],
      predicted_follow_up_topics: [String],
      conversion_killers: [String],
      negative_risks: [String],
      hallucination_flags: [{
        claimed_statement: String,
        factual_accuracy: String,
        risk_level: String
      }]
    }
  },
  { timestamps: true }
);

export const ModelResponse = models.ModelResponse || mongoose.model("ModelResponse", modelResponseSchema);
