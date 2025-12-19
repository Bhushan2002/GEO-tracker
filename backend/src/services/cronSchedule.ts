import { Prompt } from "../models/prompt.model";
import cron from "node-cron";
import { PromptRun } from "../models/promptRun.Model";
import { getOpenRenderResponse } from "./openRender";
import { ModelResponse } from "../models/modelResponse.model";

export const initScheduler = async () => {
  const prompts = await Prompt.find({ isActive: true });
  prompts.forEach((prompt) => {
    cron.schedule(prompt.schedule, async () => {
      const run = await PromptRun.create({ promptId: prompt._id });

      try {
        const result = await getOpenRenderResponse(prompt.promptText);

        for (const res of result) {
          await ModelResponse.create({
            promptRunId: run._id,
            ...res,
          });
        }

        run.status = "COMPLETED";
        await run.save();
      } catch (e) {
        run.status = "FAILED";
        await run.save();
      }
    });
  });
};
