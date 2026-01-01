export interface IPrompt {
  workspaceId?: string;
  promptText: string;
  topic: string;
  tags: string[];
  ipAddress: string;
  isActive: boolean;
  isScheduled: boolean;
}
