"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
const brandSchema = new mongoose_1.Schema({
    brand_name: { type: String, required: true, unique: true },
    mentions: { type: Number, default: 0 },
    averageSentiment: { type: String },
    lastRank: { type: Number, default: null, unique: true, sparse: true },
    prominence_score: { type: Number },
    context: { type: String },
    associated_links: [{
            url: { type: String },
            is_direct_brand_link: { type: Boolean },
            citation_type: { type: String }
        }],
}, { timestamps: true });
exports.Brand = (0, mongoose_1.model)("Brand", brandSchema);
