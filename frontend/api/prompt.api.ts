import { Prompt } from "@/types";
import { api } from "./api";

export const PromptAPI = {
  create(data: { promptText: string; topic?: string; tags?: string[] }) {
    return api.post<Prompt>("/api/prompt", data);
  },
  getAll() {
    return api.get<Prompt[]>("/api/prompt/getprompts");
  },
  toggleSchedule(id: string, start: boolean) {
    const endpoint = start ? "start-schedule" : "stop-schedule";
    return api.post(`/api/prompt/${id}/${endpoint}`);
  }
};
