import cron, { ScheduledTask } from "node-cron";
import { Prompt } from "../models/prompt.model";
import { PromptRun } from "../models/promptRun.Model";
import { ModelResponse } from "../models/modelResponse.model";
import { Brand } from "../models/brand.model";
import { TargetBrand } from "../models/targetBrand.model";
import { extractBrandFromText, getOpenRenderResponse } from "./openRender";

const scheduledTasks: Map<string, ScheduledTask> = new Map();
const runningPrompts = new Set<string>(); // prevents overlap

export const executePromptTask = async (promptId: string) => {
  if (runningPrompts.has(promptId)) {
    console.warn(`Prompt ${promptId} is already running. Skipping.`);
    return;
  }

  runningPrompts.add(promptId);

  const prompt = await Prompt.findById(promptId);
  if (!prompt) {
    runningPrompts.delete(promptId);
    return;
  }

  const run = await PromptRun.create({
    promptId: prompt._id,
    status: "RUNNING",
  });

  try {
    const trackedBrands = await TargetBrand.find({ isActive: true });
    const results = await getOpenRenderResponse(prompt.promptText);
    const targetBrandNames = trackedBrands.map(b => b.brand_name);

    for (const res of results) {
      const modelRes = await ModelResponse.create({
        promptRunId: run._id,
        responseText: res.responseText,
        modelName: res.modelName,
        latencyMs: res.latencyMs,
        tokenUsage: res.tokenUsage,
        error: res.error,
      });

      if (!res.responseText) continue;

      await new Promise((r) => setTimeout(r, 9000));

const extracted = await extractBrandFromText(res.responseText, targetBrandNames);
      if (extracted?.aeo_geo_insights) {
        await ModelResponse.findByIdAndUpdate(modelRes._id, {
          aeo_geo_insights: extracted.aeo_geo_insights,
        });
      }

      const allBrands = [
        ...(extracted?.predefined_brand_analysis || []),
        ...(extracted?.discovered_competitor_analysis || []),
      ];

      for (const data of allBrands) {
        // Check if brand matches either brand_name OR actual_brand_name in TargetBrand
        const targetMatch = trackedBrands.find(
          (b) => 
            b.brand_name.toLowerCase() === data.brand_name.toLowerCase() ||
            (b.actual_brand_name && b.actual_brand_name.toLowerCase() === data.brand_name.toLowerCase())
        );

        let alignmentNote = "Discovered Competitor";

        if (targetMatch) {
          // Increment mentions in TargetBrand when matched
          await TargetBrand.findByIdAndUpdate(
            targetMatch._id,
            { $inc: { mentions: 1 } }
          );

          const citedOfficial = data.associated_links?.some((l: any) =>
            l.url.includes(targetMatch.official_url)
          );

          alignmentNote = citedOfficial
            ? "Strong Alignment: AI used official links."
            : "Misalignment: Official links omitted.";
        } 
        // Target brands should only be added via "add target brand form", not auto-added from responses
        // else {
        //   try {
        //     await TargetBrand.create({
        //       brand_name: data.brand_name,
        //       official_url:
        //         data.associated_links?.[0]?.url ||
        //         "N/A",
        //       isActive: true,
        //     });
        //     alignmentNote = "Newly Added to Target List";
        //   } catch {
        //     // duplicate brand – ignore
        //   }
        // }

        // Add/update brand in Brand model regardless of target match
        await Brand.findOneAndUpdate(
          { brand_name: data.brand_name },
          {
            $setOnInsert: { brand_name: data.brand_name },
            $inc: { mentions: data.mention_count || 1 },
            $set: {
              averageSentiment: data.sentiment,
              prominence_score: data.prominence_score,
              context: data.context,
              associated_links: data.associated_links || [],
              alignment_analysis: alignmentNote,
            },
          },
          { upsert: true }
        );
      }
    }


    await Brand.updateMany({}, { $unset: { lastRank: "" } });

    const brands = await Brand.find().sort({
      mentions: -1,
      prominence_score: -1,
    });

    const bulkOps = brands.map((b, index) => ({
      updateOne: {
        filter: { _id: b._id },
        update: { $set: { lastRank: index + 1 } },
      },
    }));

    if (bulkOps.length) {
      await Brand.bulkWrite(bulkOps);
    }

    run.status = "COMPLETED";
  } catch (err) {
    console.error("Task Execution Error:", err);
    run.status = "FAILED";
  } finally {
    await run.save();
    runningPrompts.delete(promptId);
  }
};

export const stopPromptSchedule = (promptId: string) => {
  const task = scheduledTasks.get(promptId);
  if (!task) return false;

  task.stop();
  scheduledTasks.delete(promptId);
  return true;
};

// export const initScheduler = async () => {
//   const prompts = await Prompt.find({ isActive: true, isScheduled: true });

//   const scheduleBrands = await TargetBrand.find({isScheduled: true, isActive: true})

//   scheduledTasks.forEach((task) => task.stop());
//   scheduledTasks.clear();

//   for (const prompt of prompts) {
//     const task = cron.schedule("0 0 14 * * *", () =>
//       executePromptTask(prompt._id.toString())
//     );

//     scheduledTasks.set(prompt._id.toString(), task);
//   }
// };
