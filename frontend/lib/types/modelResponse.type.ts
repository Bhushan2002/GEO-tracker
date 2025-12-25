import mongoose from "mongoose";

export interface IModelResponse {
  promptRunId: mongoose.Types.ObjectId;
  modelName: string;
  responseText: string;
  latencyMs?: number;
  identifiedBrands: mongoose.Types.ObjectId[];
  tokenUsage?: object;
  error?: string;
  
  // Strategic Analysis Summary (response-level insights only)
  audit_summary?: {
    total_brands_detected: number;
    implied_user_persona: string;
    winning_brand: string;
    winning_factor: string[];
    missing_content_assets: Array<{
      asset_type: string;
      competitor_example: string;
      priority: string;
      impact: string;
    }>;
    predicted_follow_up_topics: string[];
    conversion_killers: string[] | null;
    negative_risks: string[] | null;
    hallucination_flags: Array<{
      claimed_statement: string;
      factual_accuracy: string;
      risk_level: string;
    }>;
  };
}
