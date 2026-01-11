import mongoose, { model, models } from "mongoose";

/**
 * Mongoose Schema for Google Analytics Account integration.
 * Stores OAuth tokens and property details for connected GA4 accounts.
 */
const gaAccountSchema = new mongoose.Schema(
    {
        workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },

        accountName: { type: String, required: true }, // User-friendly name
        accountId: { type: String, required: true },   // GA Account ID
        propertyId: { type: String, required: true },  // GA Property ID
        propertyName: { type: String, required: true },// GA Property Name

        // OAuth Credentials
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        expiresAt: { type: Date, required: true },

        userId: { type: String, required: false },    // For future multi-user mapping
        isActive: { type: Boolean, default: true },

        // GA4 Audiences for AI Traffic Tracking
        aiAudienceId: { type: String, required: false },
        aiAudienceName: { type: String, required: false },

        // Search Console Integration - ADD THESE TWO LINES ↓
        searchConsoleSiteUrl: { type: String, required: false },
        searchConsoleVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Ensure unique property connection per workspace
gaAccountSchema.index({ propertyId: 1, workspaceId: 1 }, { unique: true });

export const GAAccount = models.GAAccount || model('GAAccount', gaAccountSchema);
