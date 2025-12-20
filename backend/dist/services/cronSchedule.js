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
const initScheduler = async () => {
    const prompts = await prompt_model_1.Prompt.find({ isActive: true });
    prompts.forEach((prompt) => {
        node_cron_1.default.schedule(prompt.schedule, async () => {
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
                        error: res.error
                    });
                }
                run.status = "COMPLETED";
                await run.save();
            }
            catch (e) {
                run.status = "FAILED";
                await run.save();
            }
        });
    });
};
exports.initScheduler = initScheduler;
