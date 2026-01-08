import { Prompt } from "@/types";
import { api } from "./api";

export const PromptAPI = {
  create(data: { promptText: string; topic?: string; tags?: string[] }) {
    return api.post<Prompt>("/api/prompt", data);
  },
  getAll() {
    return api.get<Prompt[]>("/api/prompt");
  },
  toggleSchedule(id: string, start: boolean) {
    const action = start ? "start-schedule" : "stop-schedule";
    return api.post("/api/prompt/actions", { id, action });
  },
  getAnalytics(id: string) {
    return api.get(`/api/prompt/${id}`);
  }
};
