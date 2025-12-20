"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenRenderResponse = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Models = [
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
];
// https://openrouter.ai/api/v1
const getOpenRenderResponse = async (promptText) => {
    const result = [];
    for (const model of Models) {
        const start = Date.now();
        try {
            const res = await axios_1.default.post("https://openrouter.ai/api/v1/chat/completions", {
                model,
                messages: [{ role: "user", content: promptText }],
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.OPEN_RENDER_API}`,
                    "Content-Type": "application/json",
                },
            });
            result.push({
                modelName: model,
                responseText: res.data?.choices?.[0]?.message?.content,
                latencyMs: Date.now() - start,
                tokenUsage: res.data.usage,
            });
            //   console.log('Response', res.data?.choices?.[0]?.message?.content);
        }
        catch (e) {
            result.push({
                modelName: model,
                error: e.messsage,
            });
        }
    }
    return result;
};
exports.getOpenRenderResponse = getOpenRenderResponse;
