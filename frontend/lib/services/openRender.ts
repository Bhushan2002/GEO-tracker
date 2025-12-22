import axios from "axios";

const Models = [
  "openai/gpt-5.2",
  "google/gemini-3-flash-preview",
  "anthropic/claude-sonnet-4.5",
  "x-ai/grok-4.1-fast"
];

export const getOpenRenderResponse = async (promptText: string) => {
  const result = [];

  for (const model of Models) {
    const start = Date.now();

    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [{ role: "user", content: promptText }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPEN_RENDER_API}`,
            "Content-Type": "application/json",
          },
        }
      );

      result.push({
        modelName: model,
        responseText: res.data?.choices?.[0]?.message?.content,
        latencyMs: Date.now() - start,
        tokenUsage: res.data.usage,
      });
    } catch (e: any) {
      result.push({
        modelName: model,
        error: e.message || "Unknown error",
      });
    }
  }

  return result;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const extractBrandFromText = async (
  transcript: string,
  targetBrands: string[] = [],
  retries = 3
) => {
  const extractionModel = "google/gemini-2.0-flash-exp:free";

  const extractionPrompt = `
You are an expert AEO/GEO Intelligence Agent. Your mission is to perform a multi-entity audit on AI-generated chat transcripts to assess competitive visibility, citation authority, and brand sentiment.

*Task*: 
1. Analyze the provided AI chat transcript.
2. Specifically audit the "Predefined Target Brands" provided below.
3. Identify and audit "Discovered Brands" (any other brand or product mentioned that is NOT in the predefined list).
4. For every brand identified, extract detailed metrics including ranking, sentiment, and specific mentions.
5. Perform a "Link & Citation Validation" to check for source transparency.

*Input Data*:
- *Predefined Target Brands*: ${targetBrands.join(', ')}
- *Chat Transcript*: ${transcript}

*Required Analysis for Every Brand*:
- *Mention Context*: Brief summary of how the brand was framed.
- *Sentiment*: Label as "Positive", "Neutral", "Negative", or "Mixed".
- *Rank/Position*: Numerical rank if part of a list (e.g., 1, 2, 3); otherwise "Mentioned".
- *Prominence Score*: (1-10) Based on how much text/detail is dedicated to this brand.
- *Citations*: List specific URLs or sources the AI associated with this brand.

*Response Requirements*:
- Return the analysis in *structured JSON format ONLY*.
- Do not include markdown code blocks (unless requested for display), introductory text, or concluding remarks.
- Ensure the JSON is valid and parsable.

*JSON Schema*:
{
  "audit_summary": {
    "engine": "string",
    "query_intent": "string",
    "total_brands_detected": "integer"
  },
  "predefined_brand_analysis": [
    {
      "brand_name": "string",
      "found": "boolean",
      "mention_count": "integer",
      "sentiment": "string",
      "rank_position": "integer|null",
      "prominence_score": "integer",
      "context": "string",
      "associated_links": [
        {
          "url": "string",
          "is_direct_brand_link": "boolean",
          "citation_type": "string (e.g., source, recommendation, review)"
        }
      ]
    }
  ],
  "discovered_competitor_analysis": [
    {
      "brand_name": "string",
      "mention_count": "integer",
      "sentiment": "string",
      "rank_position": "integer|null",
      "prominence_score": "integer",
      "context": "string",
      "associated_links": []
    }
  ],
  "aeo_geo_insights": {
    "share_of_voice_ranking": ["brand_names_in_order_of_prominence"],
    "citation_transparency_score": "integer (1-100)",
    "recommendation_bias": "string (Does the AI favor a specific entity?)"
  }
}
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: extractionModel,
          messages: [
            { role: "system", content: extractionPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPEN_RENDER_API}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      let content = res.data?.choices?.[0]?.message?.content || "{}";

      // Strip markdown code blocks if the AI includes them
      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(content);
    } catch (e: any) {
      // Handle Rate Limiting (429) with exponential backoff
      if (e.response?.status === 429 && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 3000; // Wait 3s, 6s, 12s...
        console.warn(`Rate limited (429). Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      // Log the specific response error if available to help debug
      console.error(
        "Brand extraction failed:",
        e.response?.data?.error || e.message
      );

      if (i === retries - 1) {
        return {
          predefined_brand_analysis: [],
          discovered_competitor_analysis: [],
        };
      }
    }
  }
};
