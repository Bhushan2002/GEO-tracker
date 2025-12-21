"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PromptSchema = new mongoose_1.default.Schema({
    promptText: { type: String, required: true },
    topic: { type: String, required: true },
    ipAddress: String,
    tags: [String],
    isActive: { type: Boolean, default: true },
});
exports.Prompt = mongoose_1.default.model("Prompt", PromptSchema);
