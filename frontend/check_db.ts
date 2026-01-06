import mongoose from "mongoose";
import { connectDatabase } from "./lib/db/mongodb";
import { Prompt } from "./lib/models/prompt.model";
import { Workspace } from "./lib/models/workspace.model";

async function check() {
    await connectDatabase();
    const promptId = "69f98bb363151dad2763d9b0";
    const prompt = await Prompt.findById(promptId);
    if (prompt) {
        console.log("Prompt found:", prompt);
        const ws = await mongoose.model("Workspace").findById(prompt.workspaceId);
        console.log("Workspace found:", ws);
    } else {
        console.log("Prompt NOT found");
        const allPrompts = await Prompt.find().limit(5);
        console.log("All prompts (first 5):", allPrompts);
    }
    process.exit(0);
}

check();
