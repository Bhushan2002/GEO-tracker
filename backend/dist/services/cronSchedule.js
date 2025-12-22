"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = exports.stopPromptSchedule = exports.executePromptTask = void 0;
const prompt_model_1 = require("../models/prompt.model");
const node_cron_1 = __importDefault(require("node-cron"));
const promptRun_Model_1 = require("../models/promptRun.Model");
const openRender_1 = require("./openRender");
const modelResponse_model_1 = require("../models/modelResponse.model");
const brand_model_1 = require("../models/brand.model");
const targetBrand_model_1 = require("../models/targetBrand.model");
const scheduledTasks = new Map();
const executePromptTask = async (promptId) => {
    const prompt = await prompt_model_1.Prompt.findById(promptId);
    if (!prompt)
        return;
    const run = await promptRun_Model_1.PromptRun.create({ promptId: prompt._id, status: "RUNNING" });
    try {
        const result = await (0, openRender_1.getOpenRenderResponse)(prompt.promptText);
        const trackedBrands = await targetBrand_model_1.TargetBrand.find({ isActive: true });
        for (const res of result) {
            const modelRes = await modelResponse_model_1.ModelResponse.create({
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
                const extractedData = await (0, openRender_1.extractBrandFromText)(res.responseText);
                if (extractedData?.aeo_geo_insights) {
                    await modelResponse_model_1.ModelResponse.findByIdAndUpdate(modelRes._id, {
                        aeo_geo_insights: extractedData.aeo_geo_insights,
                    });
                }
                const allFoundBrands = [
                    ...(extractedData?.predefined_brand_analysis || []),
                    ...(extractedData?.discovered_competitor_analysis || []),
                ];
                for (const data of allFoundBrands) {
                    const targetMatch = trackedBrands.find((b) => b.brand_name.toLowerCase() === data.brand_name.toLowerCase());
                    let alignmentNote = "Discovered Competitor";
                    if (targetMatch) {
                        const citedOfficialLink = data.associated_links?.some((link) => link.url.includes(targetMatch.official_url));
                        alignmentNote = citedOfficialLink
                            ? "Strong Alignment: AI used official links."
                            : "Misalignment: Official links omitted.";
                    }
                    await brand_model_1.Brand.findOneAndUpdate({ brand_name: data.brand_name }, {
                        $inc: { mentions: data.mention_count || 1 },
                        $set: {
                            averageSentiment: data.sentiment,
                            prominence_score: data.prominence_score,
                            context: data.context,
                            associated_links: data.associated_links || [],
                            alignment_analysis: alignmentNote
                        },
                    }, { upsert: true });
                }
                // Global Rank Recalculation
                const everyBrand = await brand_model_1.Brand.find().sort({ mentions: -1, prominence_score: -1 });
                for (let i = 0; i < everyBrand.length; i++) {
                    await brand_model_1.Brand.findByIdAndUpdate(everyBrand[i]._id, { $set: { lastRank: i + 1 } });
                }
            }
        }
        run.status = "COMPLETED";
    }
    catch (e) {
        console.error("Task Execution Error:", e);
        run.status = "FAILED";
    }
    finally {
        await run.save();
    }
};
exports.executePromptTask = executePromptTask;
const stopPromptSchedule = (promptId) => {
    const task = scheduledTasks.get(promptId);
    if (task) {
        task.stop();
        scheduledTasks.delete(promptId);
        return true;
    }
    return false;
};
exports.stopPromptSchedule = stopPromptSchedule;
const initScheduler = async () => {
    const prompts = await prompt_model_1.Prompt.find({ isActive: true, isScheduled: true });
    scheduledTasks.forEach((task) => task.stop());
    scheduledTasks.clear();
    prompts.forEach((prompt) => {
        const task = node_cron_1.default.schedule("0 30 16 * * *", () => (0, exports.executePromptTask)(prompt._id.toString()));
        scheduledTasks.set(prompt._id.toString(), task);
    });
};
exports.initScheduler = initScheduler;
