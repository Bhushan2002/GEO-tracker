"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetBrand = void 0;
const mongoose_1 = require("mongoose");
const targetBrandSchema = new mongoose_1.Schema({
    brand_name: { type: String, required: true, unique: true },
    official_url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.TargetBrand = (0, mongoose_1.model)("TargetBrand", targetBrandSchema);
