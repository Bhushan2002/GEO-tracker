import { Workspace } from "../models/workspace.model";
import { Brand } from "../models/brand.model";
import { GAAccount } from "../models/gaAccount.model";
import { Prompt } from "../models/prompt.model";
import { PromptRun } from "../models/promptRun.model";
import { TargetBrand } from "../models/targetBrand.model";
import { ModelResponse } from "../models/modelResponse.model";
import mongoose from "mongoose";

export async function migrateToWorkspaces() {
    try {
        // 1. Get or create default workspace
        let defaultWs = await Workspace.findOne({ isDefault: true });

        if (!defaultWs) {
            // Check if "Creatosaurus's Workspace" exists and mark it as default
            defaultWs = await Workspace.findOne({ name: "Creatosaurus's Workspace" });
            if (!defaultWs) {
                defaultWs = await Workspace.findOne({ name: "My Workspace" });
            }
            if (defaultWs) {
                await Workspace.collection.updateOne({ _id: defaultWs._id }, { $set: { isDefault: true } });
                defaultWs = await Workspace.findOne({ isDefault: true });
            } else {
                // Create it
                defaultWs = await Workspace.create({
                    name: "Creatosaurus's Workspace",
                    isDefault: true,
                    type: "Free",
                    memberCount: 1,
                });
            }
        }

        if (!defaultWs) {
            console.error("Could not establish a default workspace for migration.");
            return;
        }

        const wsId = new mongoose.Types.ObjectId(defaultWs._id.toString());

        // 2. Update all documents that don't have a workspaceId or have it as string
        const updateDoc = { $set: { workspaceId: wsId } };
        const query = { workspaceId: { $in: [null, undefined, "null", "undefined"] } };
        const stringQuery = { workspaceId: { $type: "string" } };
        const stringUpdate = [{ $set: { workspaceId: { $toObjectId: "$workspaceId" } } }];

        await Promise.all([
            Brand.collection.updateMany(query, updateDoc),
            Brand.collection.updateMany(stringQuery, stringUpdate),

            GAAccount.collection.updateMany(query, updateDoc),
            GAAccount.collection.updateMany(stringQuery, stringUpdate),

            Prompt.collection.updateMany(query, updateDoc),
            Prompt.collection.updateMany(stringQuery, stringUpdate),

            TargetBrand.collection.updateMany(query, updateDoc),
            TargetBrand.collection.updateMany(stringQuery, stringUpdate),

            PromptRun.collection.updateMany(query, updateDoc),
            PromptRun.collection.updateMany(stringQuery, stringUpdate),

            ModelResponse.collection.updateMany(query, updateDoc),
            ModelResponse.collection.updateMany(stringQuery, stringUpdate),
        ]);

        console.log("Migration to workspaces completed successfully.");
    } catch (error) {
        console.error("Migration to workspaces failed:", error);
    }
}
