"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
const brandSchema = new mongoose_1.Schema({
    brand_name: { type: String, required: true, unique: true },
    mentions: { type: Number, default: 1 },
    averageSentiment: { type: String },
    lastRank: { type: Number, default: null }
}, { timestamps: true });
exports.Brand = (0, mongoose_1.model)("Brand", brandSchema);
