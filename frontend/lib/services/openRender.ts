import axios from "axios";

const Models = [
  "openai/gpt-5.2",
  // "google/gemini-3-flash-preview",
  "anthropic/claude-sonnet-4.5",
  // "x-ai/grok-4.1-fast",
];

export const getOpenRenderResponse = async (promptText: string) => {
  const result = [];

  const apiKey = process.env.OPEN_RENDER_API;
  console.log("[DEBUG OpenRender] API Key exists:", !!apiKey);
  console.log(
    "[DEBUG OpenRender] API Key prefix:",
    apiKey?.substring(0, 10) + "..."
  );

  console.log(
    "[DEBUG OpenRender] Starting API calls for",
    Models.length,
    "models"
  );

  for (const model of Models) {
    const start = Date.now();

    try {
      console.log(`DEBUG OpenRender Calling ${model}...`);
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [{ role: "user", content: promptText }],
          plugins: [
            {
              id: "web",
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`[DEBUG OpenRender] ${model} response status:`, res.status);
      console.log(
        `[DEBUG OpenRender] ${model} response data:`,
        JSON.stringify(res.data).substring(0, 200)
      );

      const responseText = res.data?.choices?.[0]?.message?.content;
      console.log(
        `[DEBUG OpenRender] ${model} responseText length:`,
        responseText?.length || 0
      );

      result.push({
        modelName: model,
        responseText: responseText,
        latencyMs: Date.now() - start,
        tokenUsage: res.data.usage,
      });
  

      // Add 2 second delay between API calls to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e: any) {
      console.error(`[ERROR OpenRender] ${model} failed:`, e.message);
      result.push({
        modelName: model,
        error: e.message || "Unknown error",
      });
    }
  }

  console.log("[DEBUG OpenRender] All API calls completed");
  return result;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const extractBrandFromText = async (
  transcript: string,
  mainBrand: string,
  mainBrandUrl :string,
  targetBrands: string[] = [],
  mainBrandDescription: string,
  retries = 3
) => {
  const extractionModel = "openai/gpt-5.2";

  const extractionPrompt = `
You are an advanced AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) Intelligence Audit Agent with more than 10 years of experience having worked at top SEO/GEO/AEO tools company. Your purpose is to analyze AI-generated chat transcripts to extract competitive intelligence, brand visibility metrics, brand sentiment and technical citation audits with high precision.

Task:
1. Analyze the provided AI chat transcript.
2. Specifically audit the "Predefined Target Brands" provided below.
3. Identify and audit "Discovered Brands" (any other brand or product mentioned that is NOT in the predefined list).
4. For every brand identified, extract detailed metrics as mentioned below including ranking, sentiment, specific mentions and more.
5. Perform a "Link & Citation Validation" to check for source transparency.
6. Discover other brands.
7. Don’t invent or add or assume or make extra things, just use the provided chat transcript and input data for analysis and refer only to that content.

Input Data:
- Main focus brand and url: ${mainBrand} (${mainBrandUrl})
- Main focus brand brief info: ${mainBrandDescription}
- Predefined Target Brands & their website: ${targetBrands.join(", ")}
- Chat Transcript: ${transcript}

Part 1: Global Strategic Analysis (Maps to 'audit_summary') Analyze the overall market landscape presented in the chat and insights about our “Main focus brand”.

Total Brands Detected: Total count of all brands found. (Data Type: Integer)
Implied User Persona: Who does the AI seem to think the user is based on the technical depth and tone of the response? (e.g., "Student", “Decision Maker”, "Personal",  “Employee”, “Other”). (Data Type: String)
Winning Brand: The brand most strongly recommended, contextually. (Data Type: String)
Winning Factor: Reason behind the winning brand as compared to our “Main Focus Brand” (e.g., 'Better Pricing Visibility', 'More Recent Reviews'). OR key strengths if our “Main Focus Brand” is the winner. (Data Type: Array of Strings)
Missing Content Assets: From the perspective of our "Main Focus Brand", systematically identify content gaps revealed through competitor citations where rivals possessed specific assets that went uncited for our brand. For each distinct asset type (e.g., "PDF case study", "interactive pricing calculator", "security whitepaper"), generate an object specifying: the asset type, the competitor brand that had it cited, the priority level based on competitor prevalence ("High" if 3+ competitors share this asset type, "Medium" for 1-2 competitors, "Low" for rare but strategically valuable assets), and the anticipated business impact ("Conversion" for assets directly influencing purchase decisions, "Visibility" for citation-driving content, or "Trust" for credibility-building materials). If no content gaps are detected, return null. (Data Type: Array of Objects)
Predicted Follow-up Topics: Based on the AI's conclusion, what topics is the user likely to ask about next? Or AI has suggested (e.g., "Pricing comparison", "Installation guide"). Follow-Up Opportunity (The "Stickiness" Metric) Why: AI Chat is a conversation, not a search result. The Value: If the AI ends with "Would you like to compare pricing?", you need to know that so you can create a "Pricing Comparison" page to capture that next turn. (Data Type: Array of Strings)
Conversion killers: Highlight the exact part of the text which reflects from the perspective of our “Main Focus Brand”, were the conversion killers as compared to all other mentioned brands (e.g., 'Mentioned high learning curve', 'Noted lack of SSO'). If nothing then return Null. (Data Type: Array of Strings)
Negative Risks: Highlight the exact part of the text which reflects negative or brand safety problems or association with high-risk topics (scams, lawsuits, scandal, complaint, poor security, risks bad review) for our “Main Focus brand”. If nothing then return Null. (Data Type: Array of Strings)
Hallucination Flags: For the Main focus brand, identify any statements where AI has made factually incorrect or uncertain claims that appear hallucinated. Focus primarily on false and uncertain statements. (Data Type: Array of Objects) 
9a. claimed_statement: Highlight the exact part of the text which reflects the false/uncertain claim about the Main focus brand. (Data Type: String)
9b. factual_accuracy: Classification of the claim's factual correctness. (Data Type: String) // Values: "True", "False", or "Uncertain". Use "False" for definitively incorrect claims, "Uncertain" for unverifiable or questionable statements, and "True" if verified accurately (though focus should be on False/Uncertain).
9c. risk_level: Assessment of potential brand safety impact if this hallucination proliferates in AI responses. (Data Type: String) // Values: "Low" (minor detail error), "Medium" (performance/feature misrepresentation), or "High" (pricing, safety, legal, or core competency misinformation)


Part 2: Predefined Target Brand Analysis (Maps to 'predefined_brand_analysis') Extract these metrics for EACH brand listed in "Predefined Target Brands".

Found: Whether the brand was found and mentioned at least once or not, boolean True or False. (Data Type: Boolean)
Mention Count: Number of times the brand name occurred in the chat transcript. (Data Type: Integer)
Mention Context: Brief summary of how the brand was framed and context of it. (Data Type: String)
Sentiment: Label as "Positive", "Neutral" or "Negative". (Data Type: String)
Sentiment Score: Integer (0-100, where 50 is neutral, above 50 is positive and below 50 is negative). (Data Type: Integer)
Sentiment Text: **CRITICAL** - Extract the EXACT 4-8 consecutive words from the transcript that show sentiment. Do NOT write summaries or generic text. Copy word-for-word from the transcript. Example: If transcript says "Novo Nordisk, a Danish multinational pharmaceutical company, is the manufacturer", extract "Danish multinational pharmaceutical company, is the". If brand is not found, set to null. (Data Type: String or Null)
Rank Position: Numerical rank if part of a list (e.g., 1, 2, 3); otherwise use null. (Data Type: Integer or Null)
Prominence Score: (1-100) Based on how much text/detail depth is dedicated to this brand. (Data Type: Integer)
Funnel Stage: Determine if the context of brand mention is which stage of funnel Awareness, Acquisition, Activation, Revenue, Retention, Referral. (Data Type: String)
Attribute Mapping: Identify specific features attached to the brand (e.g., "Affordable," "Premium," "Slow," "Complex"). (Data Type: Array of Strings)
Recommendation Strength: How the brand is recommended in chat (Strongly Recommended, Alternative Option, Mentioned Only, Warned Against, Barely Mentioned). (Data Type: String)
Domain Citation: **CRITICAL** - Extract the EXACT domain name from URLs in the transcript (e.g., "en.wikipedia.org", "novomedlink.com"). If no URLs mention this brand, set associated_domain to empty array []. (Data Type: String)
Domain Citation Source: Is that domain part of that particular brand website or some other website, yes or no. (Data Type: Boolean)
Domain Citation Type: categories that domain, any one only (You, UGC, Competitor, Editorial, Institutional, Reference, Review, Other). (Data Type: String)
Associated URL section (associated_url): URL Citation, URL Citation Source, URL Citation Type & URL Placement. Group these under their respective Domain.
15a. URL Citation: List specific URL from the AI chat which talks about this brand. (Data Type: String)
15b. URL Anchor Text: The exact visible text/words that are hyperlinked (e.g., "click here", "Nike Official Site", "[1]"). (Data Type: String)
15c. URL Citation Source: Is the URL part of that particular brand website or some other website, yes or no. (Data Type: Boolean)
15d. URL Citation Type: categories that domain, any one only (Home Page, Category Page, Product Page, Listicle, Comparison, Profile, Alternative, Discussion, How To Guide, Article, Other). (Data Type: String)
15e. URL Placement: where the url occurs in the chat transcript. Intro, Body Text, Body Link, Conclusion, Footnote Reference, Footnote Section, Reference Section (Data Type: String)

Part 3: Discovered Competitor Analysis (Maps to 'discovered_competitors') Analyze any other brands found in the chat that were NOT in the predefined target brand list.

Brand Name: Name of the discovered brand. (Data Type: String)
Found: Always true if listed here. (Data Type: Boolean)
Mention Count: Number of times mentioned. (Data Type: Integer)
Rank: Numerical rank if part of a list (e.g., 1, 2, 3). (Data Type: Integer or Null)
Sentiment: Label as "Positive", "Neutral" or "Negative". (Data Type: String)
Associated Links: List any URLs found for this brand. (Data Type: Array of Strings)


Definitions & Rubrics:

Hallucination Flagging Threshold: 
Only flag claims that are: Factually verifiable (pricing, features, availability, technical specs) AND Contradictory to known reality OR use uncertain language ("some say", "might have") 
Do NOT flag opinions, subjective statements, or future predictions.

Recommendation Strength Rubric: How the brand is recommended in chat

Strongly Recommended:
Criteria: AI explicitly endorses brand as primary choice, uses superlatives ("best", "top choice", "highly recommend"), positions it as clear winner, suggests user should strongly consider/purchase
Textual Cues: "I highly recommend...", "Your best option is...", "The clear winner is...", "You should definitely choose...", "In my opinion, [Brand] is the best"
Example: "For serious runners, I strongly recommend Nike - their Air Zoom series outperforms everything else in its category"
Alternative Option:
Criteria: AI presents brand as viable secondary choice, "also good", backup option, works for specific use cases, part of a shortlist but not primary
Textual Cues: "Another solid option is...", "If you want something different, consider...", "Also worth looking at...", "A good alternative would be...", "While [Main Brand] is best, [Brand] also works well"
Example: "If Nike doesn't fit your budget, Adidas is a good alternative with similar performance"
Mentioned Only:
Criteria: AI references brand in passing without endorsement, lists it among a short list of options (3-5 brands), gives neutral factual info, no buying guidance provided
Textual Cues: "Other brands include...", "Companies like...", "Some brands available are...", "There's also...", Brief listing with minimal context
Example: "Running shoe brands include Nike, Adidas, Brooks, and Asics" (no further comment on Brooks)
Barely Mentioned:
Criteria: Brand name appears only as a peripheral mention with zero context or detail, often buried in long lists (6+ brands), footnotes, "etc." phrases, or parenthetical asides. No attributes, features, or evaluation provided
Textual Cues: "and others", "etc.", parenthetical name-drop "(e.g., Brand)", footnote listing, part of exhaustive market inventory
Example: "Other brands in this space include Nike, Adidas, Brooks, Asics, Hoka, On, Saucony, etc." or "See companies like Nike, Adidas, Brooks[¹]"
Warned Against:
Criteria: AI explicitly discourages brand choice, mentions significant drawbacks, recommends avoiding, uses negative framing as primary descriptor
Textual Cues: "I would avoid...", "Not recommended because...", "Has significant issues with...", "Better to stay away from...", "Common complaints include..."
Example: "I'd warn against Brooks if you need wide sizes - their selection is extremely limited and many users report fit issues"

Edge Cases & Decision Rules for Recommendation Strength Rubric:
If AI says "some people like X but I prefer Y" → Y = Strongly Recommended, X = Alternative Option
If multiple brands are "Strongly Recommended" to different user personas, score based on primary recommendation for implied user persona
When in doubt between "Alternative" and "Mentioned Only": if ANY comparative positive attribute is given → Alternative; if neutral listing → Mentioned Only
When in doubt between "Mentioned Only" and "Barely Mentioned": if brand appears in a complete sentence with any context → Mentioned Only; if only appears in a list of 6+ brands, "etc.", parenthetical, or footnote → Barely Mentioned

Highlight text rubric: Limit the highlight text string in scenarios like Sentiment Text, Conversion killers, Negative Risks, Hallucination Flags (Claimed Statement)  to a maximum of 6 consecutive words only—enough for context and detection without bloat.

Prominence Score Rubric:
90-100: Brand is central to the answer (mentioned in opening, detailed explanation, primary recommendation)
70-89: Brand is significantly covered (multiple paragraphs, comparison table, secondary recommendation)
50-69: Brand is moderately mentioned (single paragraph, brief feature list, passing mention)
30-49: Brand is minimally mentioned (name-drop only, footnote, single sentence)
1-29: Brand is hardly mentioned (mentioned once in a list of many)

Hallucination Detection Rubric for Main Focus Brand:
FALSE: Claim contradicts known facts (e.g., wrong pricing, non-existent features, false availability)
UNCERTAIN: Claim is vague, unverifiable, or uses weasel words ("some say", "might be", " rumored")
Risk Level HIGH: Misinformation about pricing, safety, legal status, or core product claims
Risk Level MEDIUM: False technical specs, performance metrics, or feature descriptions
Risk Level LOW: Minor detail errors (founded year, CEO name) that don't affect purchase intent


Sentiment Score Rubric:

0-19: Extremely Negative
Text contains: scam accusations, lawsuits, safety warnings, "avoid at all costs", major security breaches, ethical scandals, definitive statements of being "worst in class"
Example: "Nike has ongoing labor violations and their shoes fall apart after 1 month - avoid"
20-34: Strongly Negative 
Text contains: significant complaints, poor performance claims, "not recommended", major feature gaps, high pricing criticism, reliability issues
Example: "Adidas is overpriced and their customer service is terrible based on recent reviews"
35-49: Slightly Negative
Text contains: minor complaints, mild concerns, "okay but...", mentions of learning curve, limited features, qualified praise
Example: "Brooks has decent shoes but their website is confusing and shipping is slow"
50: Neutral
Text contains: purely factual statements, feature lists without opinion, objective comparisons, mentions without adjectives
Example: "Nike offers running shoes in various sizes. Adidas also sells athletic footwear."
51-65: Slightly Positive
Text contains: modest praise, "good option", "solid choice", mild recommendations, favorable but not enthusiastic language
Example: "Brooks is a reliable brand worth considering for runners on a budget"
66-80: Moderately Positive
Text contains: clear recommendations, feature-specific praise, "highly capable", "excellent for...", comparisons favoring the brand
Example: "Nike's Air technology makes them a top choice for serious athletes - their durability is excellent"
81-90: Strongly Positive
Text contains: enthusiastic endorsement, "best in class", "top-rated", "outstanding", multiple positive attributes, primary recommendation
Example: "Adidas consistently delivers premium quality with their Boost foam - it's the most comfortable shoe I've tested"
91-100: Extremely Positive
Text contains: glowing praise, unconditional recommendation, "perfect", "unbeatable", superlative language, personal testimony
Example: "Nike is unequivocally the best athletic brand on the market - their innovation is unmatched"

Mixed Sentiment Score Handling Rubric edge cases:
If both positive and negative statements exist within 2 sentences, score = 50 (Neutral) and note both excerpts in sentiment_text
If overall tone is contradictory (e.g., "great product but terrible support"), score based on which aspect dominates the recommendation conclusion


URL Placement Rubric:

Intro: URL appears within the opening paragraph(s) that frame the response (typically the first 1-3 sentences that establish context before detailed analysis begins). Example: "Let me help you find running shoes. Check out options at nike.com to start."
Body_Text: URL is written as plain text (not hyperlinked, not clickable) within the main content body, including lists, tables, or paragraph text. Example: "For more details, visit https://nike.com/air-zoom" or "Brands to consider: Nike (https://nike.com)"
Body_Link: URL is hyperlinked via markdown or HTML anchor tags within the main content body, including links embedded in lists, tables, or paragraph text. Example: "The [Nike Air Zoom](https://nike.com/air-zoom) provides excellent cushioning."
Conclusion: URL appears within the closing paragraph(s) that summarize recommendations or provide final guidance (typically the last 1-3 sentences). Example: "In conclusion, Nike is your best bet. Visit nike.com to make your purchase."
Footnote_Reference: URL is referenced by a superscript number/symbol in the body text, with the actual URL appearing in a separate footnotes section at the bottom. Use this only for the superscript marker itself. Example: Body text shows "Nike is top-rated¹" → the "¹" gets this placement.
Footnote_Section: URL appears directly in a footnotes/endnotes section (whether or not it was referenced by superscript). Example: "\n---\n**Footnotes:**\n[1] https://nike.com\n[2] https://adidas.com"
Reference_Section: URL appears within an explicit "Sources," "References," "Citations," or "Further Reading" section that is structurally separate from narrative footnotes. Example: "\n**Sources:**\n- Nike Official Site: https://nike.com\n- Runner's World Review: https://runnersworld.com"
If unable to determine with high confidence, default to the most conservative/neutral option and set value to null.

Decision Tree for Classification of URL Placement Rubric:
1. Is it in the first/introduction paragraph? → Intro
2. Is it in the final/conclusion paragraph? → Conclusion
3. Is it in a dedicated "Sources" or "References" section? → Reference_Section
4. Is it a superscript number referencing a footnote? → Footnote_Reference
5. Is it in the footnotes section at the bottom? → Footnote_Section
6. Is it a clickable hyperlink? → Body_Link
7. Otherwise, as plain text → Body_Text
8. If a URL appears multiple times, classify based on its FIRST appearance in the transcript.


Source Domain Types: Source Type provides a high-level categorization of the entire domain or website.
You - Your own website and content. Official company websites and corporate pages
Editorial - News sites, blogs, online magazines, and other publications
Institutional - Government, educational, and non-profit organization websites
UGC - User Generated Content from social media, forums, and communities
Reference - Encyclopedias, documentation, and other reference materials
Competitor - Websites and content from direct competitors
Review - From review website across different domains
Other - Miscellaneous or uncategorized sources

Source URL Types - It offers a more granular classification, identifying the specific kind of content on a given page. This allows for a deeper analysis of the context in which your brand is mentioned.
Home Page - The main entry page of a website
Category Page - A page that lists products, articles, or subcategories
Product Page - A page detailing a single product or service
Listicle - An article structured as a list (e.g., “Top 10 Laptops of 2024”)
Comparison - An article or page that directly compares two or more products or services
Profile - A directory-style entry for a company, person, or product (e.g. G2, Yelp, Crunchbase)
Alternative - An article focused on alternatives to a specific product or service (e.g., “Best HubSpot Alternatives”)
Discussion - Content from discussion forums, comment sections, or community threads
How To Guide - Instructional content with step-by-step guidance on completing a specific task
Article - General articles, news pieces, features, and other editorial content
Other - Any page type that does not fit into the categories above

Some edge cases to handle:
If no brands are detected, return JSON with total_brands_detected: 0 and empty arrays for all brand lists.

Response Requirements: Return the output analysis in strict “Structured valid JSON Format ONLY”.
Do not include markdown, code blocks, introductory text, or concluding remarks or conversational text. No additional keys, no explanation text, no list formatting—just valid JSON
Ensure the JSON is valid and parsable. Use standard straight quotes (\`"\`) not smart quotes. (no \`\`\`json\`\`\` ticks)
If a value is unknown, use \`null\`.
Follow the strict exact output json schema format as follows

Required Output JSON Schema Format:
{
  "audit_summary": {
    "total_brands_detected": "integer",
    "implied_user_persona": "string",
    "winning_brand": "string",
    "winning_factor": ["string"],
    "missing_content_assets": [
    {
    "asset_type": "string", 
    "competitor_example": "string", 
    "priority": "string",
    "impact": "string"
     }
    ],
    "predicted_follow_up_topics": ["string"],
    "conversion_killers": ["string"],
    "negative_risks": ["string"],
    "hallucination_flags": [
    {
    "claimed_statement": "string", 
    "factual_accuracy": "string", 
    "risk_level": "string"
    }
    ]
  },
  "predefined_brand_analysis": [
    {
      "brand_name": "string",
      "found": "boolean",
      "mention_count": "integer",
      "mention_context": "string",
      "sentiment": "string",
      "sentiment_score": "integer",
      "sentiment_text": "string",
      "rank_position": "integer or null",
      "prominence_score": "integer",
      "funnel_stage": "string",
      "attribute_mapping": ["string"],
      "recommendation_strength": "string",
      "associated_domain": [
        {
          "domain_citation": "string",
          "domain_citation_source": "boolean",
          "domain_citation_type": "string",
          "associated_url": [
            {
              "url_citation": "string",
              "url_anchor_text": "string",
              "url_citation_source": "boolean",
              "url_citation_type": "string",
              "url_placement": "string"
            }
          ]
        }
      ]
    }
  ],
  "discovered_competitors": [
    {
      "brand_name": "string",
      "found": "boolean",
      "mention_count": "integer",
      "sentiment": "string",
      "rank_position": "integer or null",
      "associated_links": ["string"]
    }
  ]
}
`;

  const jsonSchema = {
    type: "object",
    properties: {
      audit_summary: {
        type: "object",
        properties: {
          total_brands_detected: { type: "integer" },
          implied_user_persona: { type: "string" },
          winning_brand: { type: "string" },
          winning_factor: { type: "array", items: { type: "string" } },
          missing_content_assets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                asset_type: { type: "string" },
                competitor_example: { type: "string" },
                priority: { type: "string" },
                impact: { type: "string" },
              },
              required: [
                "asset_type",
                "competitor_example",
                "priority",
                "impact",
              ],
            },
          },
          predicted_follow_up_topics: {
            type: "array",
            items: { type: "string" },
          },
          conversion_killers: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
          negative_risks: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
          hallucination_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                claimed_statement: { type: "string" },
                factual_accuracy: { type: "string" },
                risk_level: { type: "string" },
              },
              required: ["claimed_statement", "factual_accuracy", "risk_level"],
            },
          },
        },
        required: [
          "total_brands_detected",
          "implied_user_persona",
          "winning_brand",
          "winning_factor",
          "missing_content_assets",
          "predicted_follow_up_topics",
          "conversion_killers",
          "negative_risks",
          "hallucination_flags",
        ],
      },
      predefined_brand_analysis: {
        type: "array",
        items: {
          type: "object",
          properties: {
            brand_name: { type: "string" },
            found: { type: "boolean" },
            mention_count: { type: "integer" },
            mention_context: { type: "string" },
            sentiment: { type: "string" },
            sentiment_score: { type: "integer" },
            sentiment_text: { type: "string" },
            rank_position: { type: ["integer", "null"] },
            prominence_score: { type: "integer" },
            funnel_stage: { type: "string" },
            attribute_mapping: { type: "array", items: { type: "string" } },
            recommendation_strength: { type: "string" },
            associated_domain: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  domain_citation: { type: "string" },
                  domain_citation_source: { type: "boolean" },
                  domain_citation_type: { type: "string" },
                  associated_url: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url_citation: { type: "string" },
                        url_anchor_text: { type: "string" },
                        url_citation_source: { type: "boolean" },
                        url_citation_type: { type: "string" },
                        url_placement: { type: "string" },
                      },
                      required: [
                        "url_citation",
                        "url_anchor_text",
                        "url_citation_source",
                        "url_citation_type",
                        "url_placement",
                      ],
                    },
                  },
                },
                required: [
                  "domain_citation",
                  "domain_citation_source",
                  "domain_citation_type",
                  "associated_url",
                ],
              },
            },
          },
          required: [
            "brand_name",
            "found",
            "mention_count",
            "mention_context",
            "sentiment",
            "sentiment_score",
            "sentiment_text",
            "rank_position",
            "prominence_score",
            "funnel_stage",
            "attribute_mapping",
            "recommendation_strength",
            "associated_domain",
          ],
        },
      },
      discovered_competitors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            brand_name: { type: "string" },
            found: { type: "boolean" },
            mention_count: { type: "integer" },
            sentiment: { type: "string" },
            rank_position: { type: ["integer", "null"] },
            associated_links: { type: "array", items: { type: "string" } },
          },
          required: [
            "brand_name",
            "found",
            "mention_count",
            "sentiment",
            "rank_position",
            "associated_links",
          ],
        },
      },
    },
    required: [
      "audit_summary",
      "predefined_brand_analysis",
      "discovered_competitors",
    ],
  };

  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: extractionModel,
          messages: [
            {
              role: "system",
              content: extractionPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "brand_extraction_schema",
              strict: true,
              schema: jsonSchema,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPEN_RENDER_API}`,
            "Content-Type": "application/json",
          },
        }
      );

      let content = res.data?.choices?.[0]?.message?.content || "{}";

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
