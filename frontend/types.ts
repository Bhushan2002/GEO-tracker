
export interface Prompt {
  _id: string;
  promptText: string;
  topic?: string;
  tags: string[];
  createdAt: string;
}

export interface PromptRun {
  _id: string;
  promptId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  runAt: string;
}

export interface ModelResponse {
  _id: string;
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
  identifiedBrands?: Array<{
    _id: string;
    brand_name: string;
    mentions?: number;
    prominence_score?: number;
  }>;
}
