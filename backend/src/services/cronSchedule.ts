import { Prompt } from "../models/prompt.model";
import cron, { ScheduledTask } from "node-cron";
import { PromptRun } from "../models/promptRun.Model";
import { extractBrandFromText, getOpenRenderResponse } from "./openRender";
import { ModelResponse } from "../models/modelResponse.model";
import { Brand } from "../models/brand.model";
import { TargetBrand } from "../models/targetBrand.model";

const scheduledTasks: Map<string, ScheduledTask> = new Map();
export const executePromptTask = async (promptId: string) => {
  const prompt = await Prompt.findById(promptId);
  if (!prompt) return;

  const run = await PromptRun.create({ promptId: prompt._id, status: "RUNNING" });

  try {
    const result = await getOpenRenderResponse(prompt.promptText);
    const trackedBrands = await TargetBrand.find({ isActive: true });

    for (const res of result) {
      const modelRes = await ModelResponse.create({
        promptRunId: run._id,
        responseText: res.responseText,
        modelName: res.modelName,
        latencyMs: res.latencyMs,
        tokenUsage: res.tokenUsage,
        error: res.error,
      });

      if (res.responseText) {
        // Delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 9000));

        const extractedData = await extractBrandFromText(res.responseText);

        if (extractedData?.aeo_geo_insights) {
          await ModelResponse.findByIdAndUpdate(modelRes._id, {
            aeo_geo_insights: extractedData.aeo_geo_insights,
          });
        }

        const allFoundBrands = [
          ...(extractedData?.predefined_brand_analysis || []),
          ...(extractedData?.discovered_competitor_analysis || []),
        ];

        for (const data of allFoundBrands) {
          const targetMatch = trackedBrands.find(
            (b) => b.brand_name.toLowerCase() === data.brand_name.toLowerCase()
          );

          let alignmentNote = "Discovered Competitor";
          if (targetMatch) {
            const citedOfficialLink = data.associated_links?.some(
              (link: any) => link.url.includes(targetMatch.official_url)
            );
            alignmentNote = citedOfficialLink 
              ? "Strong Alignment: AI used official links." 
              : "Misalignment: Official links omitted.";
          }

          await Brand.findOneAndUpdate(
            { brand_name: data.brand_name },
            {
              $inc: { mentions: data.mention_count || 1 },
              $set: {
                averageSentiment: data.sentiment,
                prominence_score: data.prominence_score,
                context: data.context,
                associated_links: data.associated_links || [],
                alignment_analysis: alignmentNote
              },
            },
            { upsert: true }
          );
        }

        // Global Rank Recalculation
        const everyBrand = await Brand.find().sort({ mentions: -1, prominence_score: -1 });
        for (let i = 0; i < everyBrand.length; i++) {
          await Brand.findByIdAndUpdate(everyBrand[i]._id, { $set: { lastRank: i + 1 } });
        }
      }
    }
    run.status = "COMPLETED";
  } catch (e) {
    console.error("Task Execution Error:", e);
    run.status = "FAILED";
  } finally {
    await run.save();
  }
};
export const stopPromptSchedule = (promptId: string) => {
  const task = scheduledTasks.get(promptId);
  if (task) {
    task.stop();
    scheduledTasks.delete(promptId);
    return true;
  }
  return false;
};
export const initScheduler = async () => {
  const prompts = await Prompt.find({ isActive: true , isScheduled: true});
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks.clear();

  prompts.forEach((prompt: any) => {
    const task = cron.schedule("0 30 16 * * *", () => executePromptTask(prompt._id.toString()));
    scheduledTasks.set(prompt._id.toString(), task);
  });
};
