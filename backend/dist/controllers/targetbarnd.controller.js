"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTargetBrands = exports.createTargetBrand = void 0;
const targetBrand_model_1 = require("../models/targetBrand.model");
const createTargetBrand = async (req, res) => {
    try {
        const { brand_name, official_url } = req.body;
        const existing = await targetBrand_model_1.TargetBrand.findOne({ brand_name });
        if (existing) {
            return res.status(400).json({ message: "Target brand already exists" });
        }
        const newTarget = await targetBrand_model_1.TargetBrand.create({ brand_name, official_url });
        res.status(201).json(newTarget);
    }
    catch (e) {
        console.log(e);
    }
};
exports.createTargetBrand = createTargetBrand;
const getTargetBrands = async (req, res) => {
    try {
        const targets = await targetBrand_model_1.TargetBrand.find();
        res.status(200).json(targets);
    }
    catch (e) {
        res.status(500).json({ message: "Error fetching target brands." });
    }
};
exports.getTargetBrands = getTargetBrands;
