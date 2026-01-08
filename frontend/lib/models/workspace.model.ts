import mongoose from "mongoose";

/**
 * Mongoose Schema for Workspaces.
 * Workspaces segregate data for different users or teams.
 */
const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["Free", "Pro", "Enterprise"],
            default: "Free",
        },
        memberCount: {
            type: Number,
            default: 1,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
