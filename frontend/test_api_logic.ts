import { connectDatabase } from "./lib/db/mongodb";
import { Prompt } from "./lib/models/prompt.model";
import mongoose from "mongoose";

async function testApiLogic() {
    await connectDatabase();
    const promptId = "6949237ddf1232d1afebff26";

    // Find prompt without workspace first to see what its workspace is
    const pAny = await Prompt.findById(promptId);
    if (!pAny) {
        console.log("Prompt not found even without workspace filter.");

        // List all prompts to see what IDs we HAVE
        const all = await Prompt.find().limit(10);
        console.log("All Prompts IDs:", all.map(p => p._id.toString()));
    } else {
        console.log("Prompt FOUND without workspace filter.");
        console.log("Prompt Workspace ID:", pAny.workspaceId.toString());

        // Check if we can find it WITH workspace filter (simulating API)
        const pMatched = await Prompt.findOne({ _id: promptId, workspaceId: pAny.workspaceId });
        console.log("Prompt FOUND with matching workspace:", pMatched ? "YES" : "NO");
    }

    process.exit(0);
}

testApiLogic();
