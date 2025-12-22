"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrand = exports.createBrand = void 0;
const brand_model_1 = require("../models/brand.model");
const createBrand = async (req, res) => {
    try {
        const { brand_name, prominence_score, context, associated_links } = req.body;
        const exisitingBrand = await brand_model_1.Brand.findOne({ brand_name });
        if (exisitingBrand) {
            return res.status(400).json({ message: "Brand already exists" });
        }
        const newBrand = await brand_model_1.Brand.create({
            brand_name,
            mentions: 0,
            averageSentiment: "Neutral",
            prominence_score: prominence_score || 0,
            context: context || "",
            associated_links: associated_links || [],
        });
        res.status(201).json(newBrand);
    }
    catch (e) {
        console.error("detecting database error:", e);
        res.status(500).json({ message: "Error creating brand." });
    }
};
exports.createBrand = createBrand;
const getBrand = async (req, res) => {
    try {
        const brand = await brand_model_1.Brand.find().sort({ lastRank: 1, brand_name: 1 });
        if (!brand || brand.length === 0) {
            return res.status(404).json({ message: "No brand found" });
        }
        res.status(200).json(brand);
    }
    catch (e) {
        res.status(500).json({ message: "Error fetching brands" });
    }
};
exports.getBrand = getBrand;
