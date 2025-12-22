"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runManualTask = exports.stopTask = exports.initializeTask = exports.getPrompts = exports.createPromprt = void 0;
const prompt_model_1 = require("../models/prompt.model");
const cronSchedule_1 = require("../services/cronSchedule");
const createPromprt = async (req, res) => {
    try {
        const { promptText, topic, tags, ipAddress, schedule } = req.body;
        const prompt = await prompt_model_1.Prompt.create({
            promptText,
            topic,
            tags,
            ipAddress,
            isActive: true,
        });
        res.status(201).json(prompt);
    }
    catch (err) {
        res.status(400).json({ message: "Error creating prompt" });
    }
};
exports.createPromprt = createPromprt;
const getPrompts = async (req, res) => {
    try {
        const prompts = await prompt_model_1.Prompt.find();
        if (!prompts) {
            res.status(404).json({ message: "unable to fetch prompts" });
        }
        res.status(200).json(prompts);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.getPrompts = getPrompts;
// export const runPromptNow = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const prompt = await Prompt.findById(id);
//     if (!prompt) return res.status(404).json({ message: "Prompt not found" });
//     // Create a new Run record
//     const run = await PromptRun.create({ promptId: prompt._id, status: "RUNNING" });
//     // Start execution (async)
//     const execute = async () => {
//       try {
//         const result = await getOpenRenderResponse(prompt.promptText);
//         const trackedBrands = await TargetBrand.find({ isActive: true });
//         for (const res of result) {
//           const modelRes = await ModelResponse.create({
//             promptRunId: run._id,
//             responseText: res.responseText,
//             modelName: res.modelName,
//             latencyMs: res.latencyMs,
//             tokenUsage: res.tokenUsage,
//           });
//           if (res.responseText) {
//             const extractedData = await extractBrandFromText(res.responseText);
//             // Save insights
//             if (extractedData?.aeo_geo_insights) {
//               await ModelResponse.findByIdAndUpdate(modelRes._id, {
//                 aeo_geo_insights: extractedData.aeo_geo_insights,
//               });
//             }
//             // Process brands and alignment (similar to cron logic)
//             const allFoundBrands = [
//               ...(extractedData?.predefined_brand_analysis || []),
//               ...(extractedData?.discovered_competitor_analysis || []),
//             ];
//             for (const data of allFoundBrands) {
//               const targetMatch = trackedBrands.find(
//                 (b) => b.brand_name.toLowerCase() === data.brand_name.toLowerCase()
//               );
//               let alignmentNote = targetMatch ? "Target Match" : "Discovered";
//               await Brand.findOneAndUpdate(
//                 { brand_name: data.brand_name },
//                 {
//                   $inc: { mentions: data.mention_count || 1 },
//                   $set: { alignment_analysis: alignmentNote },
//                 },
//                 { upsert: true }
//               );
//             }
//           }
//         }
//         run.status = "COMPLETED";
//         await run.save();
//       } catch (err) {
//         run.status = "FAILED";
//         await run.save();
//       }
//     };
//     execute(); // Fire and forget
//     res.status(200).json({ message: "Execution started", runId: run._id });
//   } catch (e) {
//     res.status(500).json({ message: "Error starting execution" });
//   }
// };
const initializeTask = async (req, res) => {
    try {
        await prompt_model_1.Prompt.findByIdAndUpdate(req.params.id, { isScheduled: true });
        await (0, cronSchedule_1.initScheduler)();
        res.status(200).json({ message: "Prompt added to daily schedule" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update schedule" });
    }
};
exports.initializeTask = initializeTask;
const stopTask = async (req, res) => {
    try {
        await prompt_model_1.Prompt.findByIdAndUpdate(req.params.id, { isScheduled: false });
        // Refresh the scheduler to remove this prompt from the 1:31 AM run
        await (0, cronSchedule_1.initScheduler)();
        res.status(200).json({ message: "Prompt removed from daily schedule" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to stop schedule" });
    }
};
exports.stopTask = stopTask;
const runManualTask = async (req, res) => {
    try {
        const { id } = req.params;
        // Trigger the extraction logic immediately
        (0, cronSchedule_1.executePromptTask)(id);
        res.status(200).json({ message: "Extraction started" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to start extraction" });
    }
};
exports.runManualTask = runManualTask;
