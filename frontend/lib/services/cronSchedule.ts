import cron, { ScheduledTask } from "node-cron";
import { Prompt } from "../models/prompt.model";
import { PromptRun } from "../models/promptRun.model";
import { ModelResponse } from "../models/modelResponse.model";
import { Brand } from "../models/brand.model";
import { TargetBrand } from "../models/targetBrand.model";
import { extractBrandFromText, getOpenRenderResponse } from "./openRouter";
import mongoose from "mongoose";

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
    workspaceId: prompt.workspaceId,
    status: "RUNNING",
  });

  console.log(` Created PromptRun with ID: ${run._id}`);

  const workspaceId = prompt.workspaceId;

  try {
    // Use scheduled brands for extraction if any are scheduled, otherwise use active brands
    const scheduledBrands = await TargetBrand.find({ isScheduled: true, isActive: true, workspaceId });
    const trackedBrands = scheduledBrands.length > 0
      ? scheduledBrands
      : await TargetBrand.find({ isActive: true, workspaceId });

    console.log(` Using ${trackedBrands.length} brands for extraction (scheduled: ${scheduledBrands.length})`);
    console.log(` Brand names:`, trackedBrands.map(b => b.brand_name));

    console.log(` Calling OpenRender API...`);
    const results = await getOpenRenderResponse(prompt.promptText);
    console.log(` Received ${results.length} model responses`);

    const targetBrandNames = trackedBrands.map(b => b.brand_name);

    // STEP 1: Create all ModelResponse documents first
    console.log(` Creating ${results.length} ModelResponse documents...`);
    const modelResponses = await Promise.all(
      results.map(async (res) => {
        const modelRes = await ModelResponse.create({
          promptRunId: run._id,
          workspaceId: workspaceId,
          responseText: res.responseText,
          modelName: res.modelName,
          latencyMs: res.latencyMs,
          tokenUsage: res.tokenUsage,
          error: res.error,
          identifiedBrands: [],
        });
        console.log(` Created ModelResponse ID: ${modelRes._id} for ${res.modelName}`);
        return { modelRes, responseText: res.responseText, modelName: res.modelName };
      })
    );

    // STEP 2: Filter responses that have text and prepare for batch extraction
    const validResponses = modelResponses.filter(({ responseText }) => responseText);
    console.log(` Processing ${validResponses.length} valid responses for extraction`);

    if (validResponses.length === 0) {
      console.log(` No valid responses to extract, skipping extraction phase`);
    } else {
      // Get main brand once for all extractions
      // const mainBrandDoc = await Brand.findOne().sort({ mentions: -1, prominence_score: -1 });
      // const mainBrands = mainBrandDoc ? [mainBrandDoc.brand_name] : [];

      const mainBrandDoc = await TargetBrand.findOne({ mainBrand: true, isActive: true, workspaceId });
      const mainBrandName = mainBrandDoc ? mainBrandDoc.brand_name : "";
      const mainBrandUrl = mainBrandDoc ? mainBrandDoc.official_url : "";

      const mainBrandDescription = mainBrandDoc ? mainBrandDoc.brand_description : "";
      console.log(` Main brand for extraction: ${mainBrandDoc ? mainBrandDoc.brand_name : 'None'}`);
      const competitorBrandDoc = await TargetBrand.findOne({ workspaceId }).sort({ mentions: -1 });
      const competitorBrand = competitorBrandDoc ? [competitorBrandDoc.actual_brand_name] : [];

      const targetBrandUrl = competitorBrandDoc?.official_url || "";
      console.log(` target brand url : ${targetBrandUrl}`);

      // // STEP 3: Batch extract all responses - first call warms the cache, rest benefit
      // console.log(` Starting batch extraction for ${validResponses.length} responses...`);
      // console.log(` First extraction will warm the cache, subsequent ones will be faster and cheaper`);

      const extractions = await Promise.all(
        validResponses.map(async ({ modelRes, responseText, modelName }, index) => {
          console.log(` [${index + 1}/${validResponses.length}] Extracting brands from ${modelName}...`);

          try {
            const extracted = await extractBrandFromText(
              responseText,
              mainBrandName,
              mainBrandUrl,
              targetBrandNames,
              mainBrandDescription,
            );

            console.log(` [${index + 1}/${validResponses.length}] Extraction ${extracted ? 'successful' : 'failed'} for ${modelName}`);

            return { modelRes, extracted, modelName };
          } catch (error) {
            console.error(` [${index + 1}/${validResponses.length}] Extraction error for ${modelName}:`, error);
            return { modelRes, extracted: null, modelName };
          }
        })
      );

      console.log(` Batch extraction completed for ${extractions.length} responses`);

      // STEP 4: Update ModelResponse documents with audit summaries
      const updateOps = extractions
        .filter(({ extracted }) => extracted?.audit_summary)
        .map(({ modelRes, extracted }) => ({
          updateOne: {
            filter: { _id: modelRes._id },
            update: { $set: { audit_summary: extracted.audit_summary } },
          },
        }));

      if (updateOps.length > 0) {
        await ModelResponse.bulkWrite(updateOps);
        console.log(` Updated ${updateOps.length} ModelResponses with audit summaries`);
      }

      // STEP 5: Process brands for each model response and link them
      console.log(` Processing brands for each model response...`);

      for (const { modelRes, extracted, modelName } of extractions) {
        if (!extracted) continue;

        const brands = [
          ...(extracted.predefined_brand_analysis || []),
          ...(extracted.discovered_competitors || []),
        ];

        console.log(` Processing ${brands.length} brands from ${modelName}`);

        const brandIds: mongoose.Types.ObjectId[] = [];

        // Process each brand and collect IDs
        for (const data of brands) {
          const targetMatch = trackedBrands.find(
            (b) => b.brand_name.toLowerCase() === data.brand_name.toLowerCase()
          );

          let alignmentNote = "Discovered Competitor";

          if (targetMatch) {
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

          // Create or update brand and get the document back with running average sentiment
          const brand = await Brand.findOneAndUpdate(
            { brand_name: data.brand_name, workspaceId },
            [
              {
                $set: {
                  brand_name: data.brand_name,
                  workspaceId: workspaceId,
                  // Increment mentions visibility
                  mentions: { $add: [{ $ifNull: ["$mentions", 0] }, data.mention_count || 1] },
                  // Accumulate sentiment sum and evaluation count
                  sentiment_sum: {
                    $add: [
                      { $ifNull: ["$sentiment_sum", 0] },
                      { $toDouble: { $ifNull: [data.sentiment_score, 0] } }
                    ]
                  },
                  total_evaluations: {
                    $add: [
                      { $ifNull: ["$total_evaluations", 0] },
                      data.sentiment_score ? 1 : 0
                    ]
                  },
                  // standard fields
                  prominence_score: data.prominence_score,
                  context: data.mention_context || data.context,
                  found: data.found !== undefined ? data.found : true,
                  mention_context: data.mention_context,
                  sentiment: data.sentiment,
                  sentiment_text: data.sentiment_text,
                  rank_position: data.rank_position,
                  funnel_stage: data.funnel_stage,
                  attribute_mapping: data.attribute_mapping || [],
                  recommendation_strength: data.recommendation_strength,
                  associated_domain: data.associated_domain || [],
                  alignment_analysis: alignmentNote,
                }
              },
              {
                $set: {
                  // Calculate the overall average sentiment score across all runs
                  sentiment_score: {
                    $cond: [
                      { $gt: ["$total_evaluations", 0] },
                      { $round: [{ $divide: ["$sentiment_sum", "$total_evaluations"] }, 1] },
                      0
                    ]
                  }
                }
              }
            ],
            { upsert: true, new: true }
          );

          console.log(` Brand ${data.brand_name} - sentiment_text: ${data.sentiment_text || 'MISSING'}`);
          console.log(` Brand ${data.brand_name} - associated_domain count: ${data.associated_domain?.length || 0}`);

          if (brand && brand._id) {
            brandIds.push(brand._id);
          }
        }

        // Link brands to this ModelResponse
        if (brandIds.length > 0) {
          await ModelResponse.findByIdAndUpdate(modelRes._id, {
            identifiedBrands: brandIds,
          });
          console.log(` Linked ${brandIds.length} brands to ModelResponse ${modelRes._id}`);
        }
      }
    }

    // Sort brands and update rankings directly (no unset needed)
    console.log(` Updating brand rankings...`);
    const brands = await Brand.find({ workspaceId }).sort({
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
