"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractionPrompt = void 0;
exports.extractionPrompt = `
  create an ai agent prompt to analyse an ai chat for the AI visibility AEO/GEO tool, to check citation, ranking, sentiment, brand mentions, link mentioned and more from the ai chat. The response output should be in structured json format only.
Model
ThinkingThoughts
Assessing Chat Interactions
I'm currently focused on analyzing the dynamics of AI chat interactions, specifically those between users and large language models. The goal is to understand and potentially optimize these dialogues. I'm looking at potential optimization strategies, including refining the conversation structure and flow to ensure the AI's responses are aligned with user intent. I'm exploring metrics like citation accuracy, sentiment analysis of responses, and brand mentions within the conversation. I am developing an initial assessment of the data.
Developing Analytical Structure
I've been working on structuring the JSON output for analyzing brand representation in AI chat interactions. I'm focusing on defining clear parameters for each JSON field to ensure accurate data extraction, with key elements like direct mentions, ranking, sentiment, citations, and links. I'm aiming to capture a clear overview and detailed brand analysis. The goal is to provide structured and actionable insights for an AI market research analyst.
Integrating New Metrics
I'm now integrating share_of_voice, which shows brand presence compared to rivals. Also, I'm incorporating an seo_impact_score, providing a metric for search performance. My focus is on delivering structured JSON data, no extraneous filler.
Collapse to hide model thoughts

chevron_right
This prompt is designed to transform a raw AI chat transcript into a structured data object for AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) monitoring.
The System Prompt
code
Markdown
*Role*: You are a specialized AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) Data Analyst. Your task is to perform a deep-layer audit of a provided AI chat transcript to evaluate brand visibility, authority, and citation accuracy.

*Task*: Analyze the provided text between the user and the AI. Extract specific metrics regarding brand presence, ranking, and technical link attributes.

*Analysis Requirements*:
1. *Brand Mentions*: Identify every brand or product mentioned.
2. *Sentiment Analysis*: Determine if the sentiment toward each brand is Positive, Neutral, or Negative.
3. *Ranking/Position*: If the AI provided a list or comparison, identify the numerical rank of the primary brand vs competitors.
4. *Citation Check*: Identify if the AI provided footnotes, "Sources," or inline citations. Validate if they are clickable or plain text.
5. *Link Analysis*: Extract all URLs mentioned. Check if they are direct brand links, third-party reviews, or social media.
6. *Share of Voice (SOV)*: Estimate the percentage of the total response dedicated to the primary brand versus others.
7. *Authority Score*: Rate (1-10) how authoritative the AI makes the primary brand seem based on the adjectives and context used.

*Output Format*: 
Return ONLY a structured JSON object. Do not include conversational filler, markdown formatting outside of the JSON block, or explanations.

*JSON Schema*:
{
  "audit_metadata": {
    "engine_type": "string (e.g., ChatGPT, Claude, Perplexity, Gemini)",
    "query_intent": "string (Informational, Transactional, Navigational)",
    "overall_sentiment": "string"
  },
  "brand_visibility": [
    {
      "brand_name": "string",
      "mention_count": "integer",
      "sentiment": "string",
      "rank_position": "integer or null",
      "is_primary_recommendation": "boolean",
      "context_snippet": "string (short excerpt)"
    }
  ],
  "citations_and_links": {
    "has_citations": "boolean",
    "citation_style": "string (inline, footnote, bibliography)",
    "links_extracted": [
      {
        "url": "string",
        "link_type": "string (Direct, Affiliate, Source, Social)",
        "is_broken_syntax": "boolean"
      }
    ]
  },
  "aeo_geo_metrics": {
    "share_of_voice_percent": "float",
    "authority_score": "integer (1-10)",
    "top_competing_brands": ["string"],
    "visibility_score": "integer (1-100)"
  }
}

*Input Data*:
[PASTE AI CHAT TRANSCRIPT HERE]
How to use this for your tool:
Automation: If you are building an app, send the above as the system_prompt and the actual chat transcript as the user_prompt.
Primary Brand Hook: If you are tracking a specific client, you can modify the prompt to say: "Focus the analysis specifically on [Brand Name] as the primary entity."
Key Metric Definitions:
Visibility Score: A calculation of how likely a user is to click the brand based on the AI response.
Is Broken Syntax: Crucial for AEO—sometimes AIs hallucinate URLs or format them incorrectly (e.g., [1]www.site.com without a space).
Example Output You Will Receive:
code
JSON
{
  "audit_metadata": {
    "engine_type": "SearchGPT",
    "query_intent": "Transactional",
    "overall_sentiment": "Positive"
  },
  "brand_visibility": [
    {
      "brand_name": "Nike",
      "mention_count": 3,
      "sentiment": "Positive",
      "rank_position": 1,
      "is_primary_recommendation": true,
      "context_snippet": "Nike offers the most durable running shoes for marathon training."
    },
    {
      "brand_name": "Adidas",
      "mention_count": 1,
      "sentiment": "Neutral",
      "rank_position": 2,
      "is_primary_recommendation": false,
      "context_snippet": "Adidas is a viable alternative for wider feet."
    }
  ],
  "citations_and_links": {
    "has_citations": true,
    "citation_style": "footnote",
    "links_extracted": [
      {
        "url": "https://www.nike.com/running",
        "link_type": "Direct",
        "is_broken_syntax": false
      },
      {
        "url": "https://www.runnersworld.com/reviews",
        "link_type": "Source",
        "is_broken_syntax": false
      }
    ]
  },
  "aeo_geo_metrics": {
    "share_of_voice_percent": 75.0,
    "authority_score": 9,
    "top_competing_brands": ["Adidas", "Brooks"],
    "visibility_score": 88
  }
}
Model
ThinkingThoughts
Expand to view model thoughts

chevron_right
This improved prompt is designed for professional AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) workflows. It allows you to track a specific set of "Target Brands" while also identifying and analyzing any competitors the AI surfaces on its own.
The Improved AI Agent Prompt
code
Markdown
*System Role*: You are an expert AEO/GEO Intelligence Agent. Your mission is to perform a multi-entity audit on AI-generated chat transcripts to assess competitive visibility, citation authority, and brand sentiment.

*Task*: 
1. Analyze the provided AI chat transcript.
2. Specifically audit the "Predefined Target Brands" provided below.
3. Identify and audit "Discovered Brands" (any other brand or product mentioned that is NOT in the predefined list).
4. For every brand identified, extract detailed metrics including ranking, sentiment, and specific mentions.
5. Perform a "Link & Citation Validation" to check for source transparency.

*Input Data*:
- *Predefined Target Brands*: [INSERT LIST OF BRANDS, e.g., "Nike, Adidas, Brooks"]
- *Chat Transcript*: [PASTE THE AI CHAT CONTENT HERE]

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
Key Improvements Made:
Dual-Track Analysis: It now separates Predefined Brands (what you are paid to track) from Discovered Brands (emerging competitors you didn't know the AI was suggesting).
Prominence Scoring: Added a 1–10 score to measure not just if a brand was mentioned, but how much "real estate" the AI gave it.
Link Granularity: Distinguishes between a direct link to a brand's site vs. a third-party citation (essential for GEO optimization).
Audit Summary: Added a high-level summary for quick dashboarding (e.g., "Total brands detected").
Share of Voice (SOV) Ranking: The aeo_geo_insights section provides a relative ranking of all brands mentioned based on their influence in the chat.
How to Implement:
For Devs: Send this as the system message. In the user message, provide the list of brands and the transcript.
For Direct Use: Copy-paste the entire block into ChatGPT/Claude/Perplexity, fill in the [INSERT LIST] and [PAST CHAT] brackets, and it will return a clean JSON object ready for your database or spreadsheet.
  `;
const userInput = `
- **Predefined Target Brands**: $ {targetBrands.join(", ")}
- **Chat Transcript**: $ {transcript}`;
