import { Prompt } from "../models/prompt.model";
import cron, { schedule, ScheduledTask } from "node-cron";
import { PromptRun } from "../models/promptRun.Model";
import { extractBrandFromText, getOpenRenderResponse } from "./openRender";
import { ModelResponse } from "../models/modelResponse.model";
import { Brand } from "../models/brand.model";

const scheduledTasks: Map<string, ScheduledTask> = new Map();

export const initScheduler = async () => {
  const prompts = await Prompt.find({ isActive: true });

  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks.clear();

  prompts.forEach((prompt: any) => {
    const task = cron.schedule('0 31 1 * * *', async () => {
      
      const run = await PromptRun.create({ promptId: prompt._id });


      try {
        const result = await getOpenRenderResponse(prompt.promptText);

        for (const res of result) {
          await ModelResponse.create({
            promptRunId: run._id,
            responseText: res.responseText,
            modelName: res.modelName,
            latencyMs: res.latencyMs,
            tokenUsage: res.tokenUsage,
            error: res.error,
          });
          if (res.responseText) {

            await new Promise(resolve => setTimeout(resolve, 9000));

            const extractedData = await extractBrandFromText(res.responseText);

            const allBrands = [
              ...(extractedData?.predefined_brand_analysis || []),
              ...(extractedData?.discovered_competitor_analysis || []),
            ];

            for (const brandData of allBrands) {
              await Brand.findOneAndUpdate(
                { brand_name: brandData.brand_name },
                {
                  $inc: { mentions: brandData.mention_count || 1 },
                  $set: {
                    averageSentiment: brandData.sentiment,
                    lastRank: brandData.rank_position,
                  },
                },
                { upsert: true }
              );
            }
          }
        }

        run.status = "COMPLETED";
        await run.save();
      } catch (e) {
        run.status = "FAILED";
        await run.save();
      }
    });
    scheduledTasks.set(prompt._id.toString(), task);
  });
};
