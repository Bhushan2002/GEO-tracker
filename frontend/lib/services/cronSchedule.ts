import cron, { ScheduledTask } from "node-cron";
import { Prompt } from "../models/prompt.model";
import { PromptRun } from "../models/promptRun.model";
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
  console.log(` Starting execution for prompt ${promptId}`);

  const prompt = await Prompt.findById(promptId);
  if (!prompt) {
    console.error(` Prompt ${promptId} not found`);
    runningPrompts.delete(promptId);
    return;
  }

  console.log(` Found prompt: ${prompt.promptText.substring(0, 50)}...`);

  const run = await PromptRun.create({
    promptId: prompt._id,
    status: "RUNNING",
  });

  console.log(` Created PromptRun with ID: ${run._id}`);

  try {
    // Use scheduled brands for extraction if any are scheduled, otherwise use active brands
    const scheduledBrands = await TargetBrand.find({ isScheduled: true, isActive: true });
    const trackedBrands = scheduledBrands.length > 0 
      ? scheduledBrands 
      : await TargetBrand.find({ isActive: true });
    
    console.log(` Using ${trackedBrands.length} brands for extraction (scheduled: ${scheduledBrands.length})`);
    console.log(` Brand names:`, trackedBrands.map(b => b.brand_name));
    
    console.log(` Calling OpenRender API...`);
    const results = await getOpenRenderResponse(prompt.promptText);
    console.log(` Received ${results.length} model responses`);
    
    const targetBrandNames = trackedBrands.map(b => b.brand_name);

    for (const res of results) {
      console.log(` Processing response from model: ${res.modelName}`);
      
      const modelRes = await ModelResponse.create({
        promptRunId: run._id,
        responseText: res.responseText,
        modelName: res.modelName,
        latencyMs: res.latencyMs,
        tokenUsage: res.tokenUsage,
        error: res.error,
      });

      console.log(` Created ModelResponse ID: ${modelRes._id}`);

      if (!res.responseText) {
        console.log(` No response text, skipping extraction`);
        continue;
      }

      console.log(` Response text length: ${res.responseText.length} chars`);
      console.log(` 12 seconds before extraction...`);
      await new Promise((r) => setTimeout(r, 12000));

      console.log(`Calling extractBrandFromText...`);
      const extracted = await extractBrandFromText(res.responseText, targetBrandNames);
      console.log(` Extraction result:`, extracted ? 'Success' : 'Failed');
      if (extracted?.aeo_geo_insights) {
        console.log(` Updating ModelResponse with AEO insights`);
        await ModelResponse.findByIdAndUpdate(modelRes._id, {
          aeo_geo_insights: extracted.aeo_geo_insights,
        });
      }

      const allBrands = [
        ...(extracted?.predefined_brand_analysis || []),
        ...(extracted?.discovered_competitor_analysis || []),
      ];

      console.log(` Total brands to process: ${allBrands.length}`);

      for (const data of allBrands) {
        console.log(` Processing brand: ${data.brand_name}`);
        const targetMatch = trackedBrands.find(
          (b) => b.brand_name.toLowerCase() === data.brand_name.toLowerCase()
        );

        let alignmentNote = "Discovered Competitor";

        if (targetMatch) {
          const citedOfficial = data.associated_links?.some((l: any) =>
            l.url.includes(targetMatch.official_url)
          );

          alignmentNote = citedOfficial
            ? "Strong Alignment: AI used official links."
            : "Misalignment: Official links omitted.";
        } else {
          try {
            await TargetBrand.create({
              brand_name: data.brand_name,
              official_url:
                data.associated_links?.[0]?.url ||
                "N/A",
              isActive: true,
            });
            console.log(` Created new TargetBrand: ${data.brand_name}`);
            alignmentNote = "Newly Added to Target List";
          } catch (err) {
            console.log(`[DEBUG] Duplicate brand, skipping: ${data.brand_name}`);
            // duplicate brand – ignore
          }
        }

        console.log(` Upserting Brand document for: ${data.brand_name}`);
        await Brand.findOneAndUpdate(
          { brand_name: data.brand_name },
          {
            $setOnInsert: { 
              brand_name: data.brand_name,
              lastRank: 9999 // Temporary rank, will be updated in ranking phase
            },
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
        console.log(` Brand upserted successfully: ${data.brand_name}`);
      }
    }

    // Sort brands and update rankings directly (no unset needed)
    console.log(` Updating brand rankings...`);
    const brands = await Brand.find().sort({
      mentions: -1,
      prominence_score: -1,
    });

    console.log(` Found ${brands.length} brands to rank`);

    const bulkOps = brands.map((b, index) => ({
      updateOne: {
        filter: { _id: b._id },
        update: { $set: { lastRank: index + 1 } },
      },
    }));

    if (bulkOps.length) {
      await Brand.bulkWrite(bulkOps);
      console.log(`[DEBUG] Rankings updated for ${bulkOps.length} brands`);
    }

    run.status = "COMPLETED";
    console.log(`[DEBUG] Task completed successfully`);
  } catch (err) {
    console.error("[ERROR] Task Execution Error:", err);
    run.status = "FAILED";
  } finally {
    await run.save();
    runningPrompts.delete(promptId);
    console.log(`[DEBUG] Execution finished for prompt ${promptId}`);
  }
};

export const stopPromptSchedule = (promptId: string) => {
  const task = scheduledTasks.get(promptId);
  if (!task) return false;

  task.stop();
  scheduledTasks.delete(promptId);
  return true;
};

export const initScheduler = async () => {
  // ===== CRON SCHEDULING DISABLED FOR TESTING =====
  // Uncomment below to enable automatic daily execution at 2:00 PM
  
  /*
  const prompts = await Prompt.find({ isActive: true, isScheduled: true });
  const scheduleBrands = await TargetBrand.find({ isScheduled: true, isActive: true });

  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks.clear();

  for (const prompt of prompts) {
    const task = cron.schedule("0 0 14 * * *", () =>
      executePromptTask(prompt._id.toString())
    );

    scheduledTasks.set(prompt._id.toString(), task);
  }
  */
  
  console.log("Cron scheduler initialization skipped (testing mode)");
};
