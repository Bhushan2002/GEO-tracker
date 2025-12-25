  const extractionPrompt = `
You are an expert AEO/GEO Intelligence Agent. Your mission is to perform a multi-entity audit on AI-generated chat transcripts to assess competitive visibility, citation authority, and brand sentiment.

*Task*: 
1. Analyze the provided AI chat transcript.
2. Specifically audit the "Predefined Target Brands" provided below.
3. Identify and audit "Discovered Brands" (any other brand or product mentioned that is NOT in the predefined list).
4. For every brand identified, extract detailed metrics including ranking, sentiment, and specific mentions.
5. Perform a "Link & Citation Validation" to check for source transparency.

*Input Data*:
- *Predefined Target Brands*: ${targetBrands.join(", ")}
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
