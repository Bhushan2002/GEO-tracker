
// --- Core Data Entitites ---

/**
 * Represents a user-configured Prompt for brand monitoring.
 */
export interface Prompt {
  _id: string;
  promptText: string;
  topic?: string;
  tags: string[];
  isScheduled: boolean;
  createdAt: string;
}

/**
 * Represents a single execution instance of a Prompt.
 */
export interface PromptRun {
  _id: string;
  promptId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  runAt: string;
}

/**
 * Represents a response associated with a specific AI model and prompt execution.
 * Contains the raw text, analysis results, and citation data.
 */
export interface ModelResponse {
  _id: string;

  // Can be a raw ID string or a populated object depending on the query
  promptRunId: string | {
    _id: string;
    promptId: {
      _id: string;
      promptText: string;
      topic?: string;
      tags: string[];
    };
    status: "RUNNING" | "COMPLETED" | "FAILED";
  };

  modelName: string;
  responseText?: string;
  latencyMs?: number;

  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  error?: string;

  createdAt: string;

  // Analysis results extracted from the response text
  identifiedBrands?: Array<{
    _id: string;
    brand_name: string;
    mentions?: number;
    prominence_score?: number;
    sentiment?: string;
    sentiment_score?: number;

    // Domain citations linked to this brand mention
    associated_domain?: Array<{
      domain_citation: string;
      domain_citation_type?: string;

      // Specific URL links found
      associated_url?: Array<{
        url_citation: string;
        url_anchor_text?: string;
        url_citation_type?: string;
      }>;
    }>;
  }>;
}
