import mongoose, { model, models } from "mongoose";

const gaAccountSchema = new mongoose.Schema({
    accountName: { type: String, required: true }, // User-friendly name for the account
    accountId: { type: String, required: true }, // GA Account ID
    propertyId: { type: String, required: true }, // GA Property ID
    propertyName: { type: String, required: true }, // GA Property Name
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userId: { type: String, required: false }, // For future multi-user support
    isActive: { type: Boolean, default: true },
    aiAudienceId: { type: String, required: false }, // GA4 AI Traffic Audience ID
    aiAudienceName: { type: String, required: false }, // GA4 AI Traffic Audience Name
}, { timestamps: true });

gaAccountSchema.index({ propertyId: 1 }, { unique: true });

export const GAAccount = models.GAAccount || model('GAAccount', gaAccountSchema);
