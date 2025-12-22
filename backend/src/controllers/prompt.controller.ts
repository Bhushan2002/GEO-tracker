import { Request, Response } from "express";
import { Prompt } from "../models/prompt.model";
import { ModelResponse } from "../models/modelResponse.model";
import { PromptRun } from "../models/promptRun.Model";
import { extractBrandFromText, getOpenRenderResponse } from "../services/openRender";
import { TargetBrand } from "../models/targetBrand.model";
import { initScheduler } from "../services/cronSchedule";

export const createPromprt = async (req: Request, res: Response) => {
  try {
    const { promptText, topic, tags, ipAddress, schedule } = req.body;

    const prompt = await Prompt.create({
      promptText,
      topic,
      tags,
      ipAddress,

      isActive: true,
    });
    res.status(201).json(prompt);
  } catch (err) {
    res.status(400).json({ message: "Error creating prompt" });
  }
};

export const getPrompts = async (req: Request, res: Response) => {
  try {
    const prompts = await Prompt.find();
    if (!prompts) {
      res.status(404).json({ message: "unable to fetch prompts" });
    }
    res.status(200).json(prompts);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};


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

export const initializeTask = async (req: Request, res: Response) => {
  try {
    await Prompt.findByIdAndUpdate(req.params.id, { isScheduled: true });
    await initScheduler(); 
    res.status(200).json({ message: "Prompt added to daily schedule" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update schedule" });
  }
};

export const stopTask = async (req: Request, res:Response) => {
  try {
    await Prompt.findByIdAndUpdate(req.params.id, { isScheduled: false });
    // Refresh the scheduler to remove this prompt from the 1:31 AM run
    await initScheduler(); 
    res.status(200).json({ message: "Prompt removed from daily schedule" });
  } catch (error) {
    res.status(500).json({ message: "Failed to stop schedule" });
  }
};


