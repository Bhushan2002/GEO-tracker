"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = void 0;
const prompt_model_1 = require("../models/prompt.model");
const node_cron_1 = __importDefault(require("node-cron"));
const promptRun_Model_1 = require("../models/promptRun.Model");
const openRender_1 = require("./openRender");
const modelResponse_model_1 = require("../models/modelResponse.model");
const brand_model_1 = require("../models/brand.model");
const scheduledTasks = new Map();
const initScheduler = async () => {
    const prompts = await prompt_model_1.Prompt.find({ isActive: true });
    scheduledTasks.forEach((task) => task.stop());
    scheduledTasks.clear();
    prompts.forEach((prompt) => {
        const task = node_cron_1.default.schedule('0 31 1 * * *', async () => {
            const run = await promptRun_Model_1.PromptRun.create({ promptId: prompt._id });
            try {
                const result = await (0, openRender_1.getOpenRenderResponse)(prompt.promptText);
                for (const res of result) {
                    await modelResponse_model_1.ModelResponse.create({
                        promptRunId: run._id,
                        responseText: res.responseText,
                        modelName: res.modelName,
                        latencyMs: res.latencyMs,
                        tokenUsage: res.tokenUsage,
                        error: res.error,
                    });
                    if (res.responseText) {
                        await new Promise(resolve => setTimeout(resolve, 9000));
                        const extractedData = await (0, openRender_1.extractBrandFromText)(res.responseText);
                        const allBrands = [
                            ...(extractedData?.predefined_brand_analysis || []),
                            ...(extractedData?.discovered_competitor_analysis || []),
                        ];
                        for (const brandData of allBrands) {
                            await brand_model_1.Brand.findOneAndUpdate({ brand_name: brandData.brand_name }, {
                                $inc: { mentions: brandData.mention_count || 1 },
                                $set: {
                                    averageSentiment: brandData.sentiment,
                                    lastRank: brandData.rank_position,
                                },
                            }, { upsert: true });
                        }
                    }
                }
                run.status = "COMPLETED";
                await run.save();
            }
            catch (e) {
                run.status = "FAILED";
                await run.save();
            }
        });
        scheduledTasks.set(prompt._id.toString(), task);
    });
};
exports.initScheduler = initScheduler;
