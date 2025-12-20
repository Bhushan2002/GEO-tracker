
export interface Prompt {
  _id: string;
  promptText: string;
  topic?: string;
  tags: string[];
  schedule: {
    cronExpression: string;
    enabled: boolean;
  };
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
  promptRunId: string;
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
}
