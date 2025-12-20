"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrompts = exports.createPromprt = void 0;
const prompt_model_1 = require("../models/prompt.model");
const createPromprt = async (req, res) => {
    try {
        const { promptText, topic, tags, ipAddress, schedule } = req.body;
        const prompt = await prompt_model_1.Prompt.create({
            promptText,
            topic,
            tags,
            ipAddress,
            schedule,
            isActive: true,
        });
        res.status(201).json(prompt);
    }
    catch (err) {
        res.status(400).json({ message: "Error creating prompt" });
    }
};
exports.createPromprt = createPromprt;
const getPrompts = async (req, res) => {
    try {
        const prompts = await prompt_model_1.Prompt.find();
        if (!prompts) {
            res.status(404).json({ message: 'unable to fetch prompts' });
        }
        res.status(200).json({ prompts, message: 'successfully fetched' });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.getPrompts = getPrompts;
