"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = exports.stopPromptSchedule = exports.executePromptTask = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prompt_model_1 = require("../models/prompt.model");
const promptRun_Model_1 = require("../models/promptRun.Model");
const modelResponse_model_1 = require("../models/modelResponse.model");
const brand_model_1 = require("../models/brand.model");
const targetBrand_model_1 = require("../models/targetBrand.model");
const openRender_1 = require("./openRender");
const scheduledTasks = new Map();
const runningPrompts = new Set(); // prevents overlap
const executePromptTask = async (promptId) => {
    if (runningPrompts.has(promptId)) {
        console.warn(`Prompt ${promptId} is already running. Skipping.`);
        return;
    }
    runningPrompts.add(promptId);
    const prompt = await prompt_model_1.Prompt.findById(promptId);
    if (!prompt) {
        runningPrompts.delete(promptId);
        return;
    }
    const run = await promptRun_Model_1.PromptRun.create({
        promptId: prompt._id,
        status: "RUNNING",
    });
    try {
        const results = await (0, openRender_1.getOpenRenderResponse)(prompt.promptText);
        const trackedBrands = await targetBrand_model_1.TargetBrand.find({ isActive: true });
        for (const res of results) {
            const modelRes = await modelResponse_model_1.ModelResponse.create({
                promptRunId: run._id,
                responseText: res.responseText,
                modelName: res.modelName,
                latencyMs: res.latencyMs,
                tokenUsage: res.tokenUsage,
                error: res.error,
            });
            if (!res.responseText)
                continue;
            await new Promise((r) => setTimeout(r, 9000));
            const extracted = await (0, openRender_1.extractBrandFromText)(res.responseText);
            if (extracted?.aeo_geo_insights) {
                await modelResponse_model_1.ModelResponse.findByIdAndUpdate(modelRes._id, {
                    aeo_geo_insights: extracted.aeo_geo_insights,
                });
            }
            const allBrands = [
                ...(extracted?.predefined_brand_analysis || []),
                ...(extracted?.discovered_competitor_analysis || []),
            ];
            for (const data of allBrands) {
                const targetMatch = trackedBrands.find((b) => b.brand_name.toLowerCase() === data.brand_name.toLowerCase());
                let alignmentNote = "Discovered Competitor";
                if (targetMatch) {
                    const citedOfficial = data.associated_links?.some((l) => l.url.includes(targetMatch.official_url));
                    alignmentNote = citedOfficial
                        ? "Strong Alignment: AI used official links."
                        : "Misalignment: Official links omitted.";
                }
                else {
                    try {
                        await targetBrand_model_1.TargetBrand.create({
                            brand_name: data.brand_name,
                            official_url: data.associated_links?.[0]?.url ||
                                "https://pending-verification.com",
                            isActive: true,
                        });
                        alignmentNote = "Newly Added to Target List";
                    }
                    catch {
                        // duplicate brand – ignore
                    }
                }
                await brand_model_1.Brand.findOneAndUpdate({ brand_name: data.brand_name }, {
                    $setOnInsert: { brand_name: data.brand_name },
                    $inc: { mentions: data.mention_count || 1 },
                    $set: {
                        averageSentiment: data.sentiment,
                        prominence_score: data.prominence_score,
                        context: data.context,
                        associated_links: data.associated_links || [],
                        alignment_analysis: alignmentNote,
                    },
                }, { upsert: true });
            }
        }
        // ------------------------
        // RANKING (SAFE SECTION)
        // ------------------------
        // remove previous ranks
        await brand_model_1.Brand.updateMany({}, { $unset: { lastRank: "" } });
        const brands = await brand_model_1.Brand.find().sort({
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
            await brand_model_1.Brand.bulkWrite(bulkOps);
        }
        run.status = "COMPLETED";
    }
    catch (err) {
        console.error("Task Execution Error:", err);
        run.status = "FAILED";
    }
    finally {
        await run.save();
        runningPrompts.delete(promptId);
    }
};
exports.executePromptTask = executePromptTask;
const stopPromptSchedule = (promptId) => {
    const task = scheduledTasks.get(promptId);
    if (!task)
        return false;
    task.stop();
    scheduledTasks.delete(promptId);
    return true;
};
exports.stopPromptSchedule = stopPromptSchedule;
const initScheduler = async () => {
    const prompts = await prompt_model_1.Prompt.find({ isActive: true, isScheduled: true });
    scheduledTasks.forEach((task) => task.stop());
    scheduledTasks.clear();
    for (const prompt of prompts) {
        const task = node_cron_1.default.schedule("0 0 14 * * *", () => (0, exports.executePromptTask)(prompt._id.toString()));
        scheduledTasks.set(prompt._id.toString(), task);
    }
};
exports.initScheduler = initScheduler;
