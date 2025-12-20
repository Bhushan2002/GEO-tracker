"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelResponses = void 0;
const modelResponse_model_1 = require("../models/modelResponse.model");
const getModelResponses = async (req, res) => {
    try {
        const modelResponse = await modelResponse_model_1.ModelResponse.find();
        res.status(200).json(modelResponse);
    }
    catch (err) {
        res.status(400).json({ message: "Error fetching model responses" });
    }
};
exports.getModelResponses = getModelResponses;
