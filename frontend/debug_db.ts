import { connectDatabase } from "./lib/db/mongodb";
import { Prompt } from "./lib/models/prompt.model";
import mongoose from "mongoose";

async function checkPrompt() {
    await connectDatabase();
    const id = "69491ed7df1232d1afebff18"; // From a previous log? No, let's check the current one.
    const idFromUrl = "6949237ddf1232d1afebff26";

    const p1 = await Prompt.findById(idFromUrl);
    console.log("Prompt from URL:", p1 ? "FOUND" : "NOT FOUND");
    if (p1) console.log("Workspace ID:", p1.workspaceId);

    const all = await Prompt.find().limit(5);
    console.log("All Prompts (sample):", all.map(p => ({ id: p._id, text: p.promptText.substring(0, 20), ws: p.workspaceId })));

    process.exit(0);
}

checkPrompt();
