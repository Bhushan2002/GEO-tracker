import { Prompt } from "@/types";
import { api } from "./api";

/**
 * Service for handling all Prompt-related API interactions.
 * Connects to the `/api/prompt` endpoints.
 */
export const PromptAPI = {

  /**
   * Creates a new prompt configuration.
   * @param data - The prompt text and optional metadata (topic, tags).
   */
  create(data: { promptText: string; topic?: string; tags?: string[] }) {
    return api.post<Prompt>("/api/prompt", data);
  },

  /**
   * Retrieves all prompts for the current workspace.
   */
  getAll() {
    return api.get<Prompt[]>("/api/prompt");
  },

  /**
   * Toggles the automated schedule for a specific prompt.
   * @param id - The ID of the prompt to toggle.
   * @param start - True to start scheduling, false to stop/pause.
   */
  toggleSchedule(id: string, start: boolean) {
    const action = start ? "start-schedule" : "stop-schedule";
    return api.post("/api/prompt/actions", { id, action });
  },

  /**
   * Fetches detailed analytics for a single prompt.
   * Includes visibility trends, sentiment analysis, and execution history.
   * @param id - The prompt ID.
   */
  getAnalytics(id: string) {
    return api.get(`/api/prompt/${id}`);
  },

  /**
   * Updates a prompt's tags.
   * @param id - The prompt ID.
   * @param data - The updated data (currently only tags are updatable).
   */
  update(id: string, data: { tags: string[] }) {
    return api.patch(`/api/prompt/${id}`, data);
  },

  /**
   * Deletes a prompt.
   * @param id - The prompt ID.
   */
  delete(id: string) {
    return api.delete(`/api/prompt/${id}`);
  }
};
