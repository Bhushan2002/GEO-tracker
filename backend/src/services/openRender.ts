import axios from "axios";
import { modelNames } from "mongoose";

const Models = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
];

// https://openrouter.ai/api/v1
export const getOpenRenderResponse = async (
  promptText: string
) => {
  const result = [];

  for (const model of Models) {
    const start = Date.now();

    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          message: [{ role: "user", content: promptText }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPEN_RENDER_API}`,
            "Content-Type": "application/json",
          },
        }
      );
      result.push({
        modelNames: model,
        responseText: res.data.choices[0].message.content,
        latencyMs: Date.now() - start,
        tokenUsage: res.data.usage,
      });
      console.log(res.data.choices[0].message.content);
    } catch (e: any) {
      result.push({
        modelName: model,
        error: e.messsage,
      });
    }
  }

  return result;
};
