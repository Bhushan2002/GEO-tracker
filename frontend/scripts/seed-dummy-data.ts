import mongoose from "mongoose";
import { config } from "dotenv";
import { Brand } from "../lib/models/brand.model";
import { Prompt } from "../lib/models/prompt.model";
import { PromptRun } from "../lib/models/promptRun.model";
import { ModelResponse } from "../lib/models/modelResponse.model";
import { TargetBrand } from "../lib/models/targetBrand.model";
import { Workspace } from "../lib/models/workspace.model";

// Load environment variables from .env.local
config({ path: ".env.local" });

const MONGO_URL = process.env.MONGO_URL!;

if (!MONGO_URL) {
  throw new Error("Please define MONGO_URL in your .env.local");
}

// Dummy data generators
const DUMMY_BRANDS = [
  "Ozempic", "Wegovy", "Mounjaro", "Saxenda", "Contrave",
  "Victoza", "Trulicity", "Rybelsus", "Zepbound", "Qsymia",
  "Phentermine", "Belviq", "Xenical", "Alli", "Adipex-P",
  "Liraglutide", "Semaglutide", "Tirzepatide", "Dulaglutide", "Orlistat",
  "Naltrexone-Bupropion", "Topiramate-Phentermine", "Setmelanotide", "Imcivree", "Plenity",
  "Lomaira", "Metformin", "Glucophage", "Januvia", "Invokana"
];

const DUMMY_DOMAINS = [
  { domain: "ozempic.com", type: "You" },
  { domain: "wegovy.com", type: "Competitor" },
  { domain: "webmd.com", type: "Reference" },
  { domain: "healthline.com", type: "Editorial" },
  { domain: "reddit.com", type: "UGC" },
  { domain: "mayoclinic.org", type: "Editorial" },
  { domain: "nih.gov", type: "Institutional" },
  { domain: "fda.gov", type: "Institutional" },
  { domain: "health.com", type: "Editorial" },
  { domain: "medicalnewstoday.com", type: "Editorial" },
  { domain: "drugs.com", type: "Reference" },
  { domain: "youtube.com", type: "UGC" },
  { domain: "rxlist.com", type: "Reference" },
  { domain: "everydayhealth.com", type: "Editorial" },
  { domain: "medscape.com", type: "Editorial" }
];

const SENTIMENT_OPTIONS = ["Positive", "Neutral", "Negative", "Mixed"];
const FUNNEL_STAGES = ["Awareness", "Consideration", "Decision", "Purchase"];
const RECOMMENDATION_STRENGTH = ["Strong", "Moderate", "Weak", "None"];
const AI_MODELS = [
  "gpt-4-turbo",
  "claude-3-sonnet",
  "gemini-pro"
];

const TOPICS = [
  "Weight management medications",
  "GLP-1 medications for weight loss",
  "Weight loss drugs"
];

const PROMPT_TEXTS = [
  "which medication is better for weight management",
  "glp-1 medications for weight loss",
  "weight loss drugs"
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomNumber(0, daysAgo));
  date.setHours(randomNumber(0, 23), randomNumber(0, 59), randomNumber(0, 59));
  return date;
}

function generateDummyBrand(workspaceId: mongoose.Types.ObjectId, brandName: string, index: number) {
  const sentiment = randomElement(SENTIMENT_OPTIONS);
  const sentimentScore = sentiment === "Positive" ? randomNumber(7, 10) :
                         sentiment === "Negative" ? randomNumber(1, 4) :
                         randomNumber(4, 7);

  const numDomains = randomNumber(1, 4);
  const associatedDomains = [];

  for (let i = 0; i < numDomains; i++) {
    const domainInfo = randomElement(DUMMY_DOMAINS);
    const numUrls = randomNumber(1, 3);
    const urls = [];

    for (let j = 0; j < numUrls; j++) {
      urls.push({
        url_citation: `https://${domainInfo.domain}/article-${randomNumber(100, 999)}`,
        url_anchor_text: `${brandName} review`,
        url_citation_source: Math.random() > 0.5,
        url_citation_type: domainInfo.type,
        url_placement: randomElement(["inline", "footer", "sidebar"])
      });
    }

    associatedDomains.push({
      domain_citation: domainInfo.domain,
      domain_citation_source: Math.random() > 0.3,
      domain_citation_type: domainInfo.type,
      associated_url: urls
    });
  }

  return {
    workspaceId,
    brand_name: brandName,
    mentions: randomNumber(5, 150),
    lastRank: index + 1,
    found: true,
    mention_context: `${brandName} is frequently mentioned in discussions about quality and innovation in the industry.`,
    sentiment,
    sentiment_score: sentimentScore,
    sentiment_text: `${sentiment} sentiment based on user reviews and expert opinions`,
    rank_position: index + 1,
    funnel_stage: randomElement(FUNNEL_STAGES),
    attribute_mapping: [
      "Quality",
      "Innovation",
      "Price",
      "Customer Service"
    ].slice(0, randomNumber(1, 4)),
    recommendation_strength: randomElement(RECOMMENDATION_STRENGTH),
    associated_domain: associatedDomains,
    alignment_analysis: `Strong alignment with user preferences in ${randomElement(["quality", "value", "innovation", "reliability"])}.`,
    createdAt: randomDate(60),
    updatedAt: randomDate(30)
  };
}

function generateDummyPrompt(workspaceId: mongoose.Types.ObjectId, index: number) {
  return {
    workspaceId,
    promptText: PROMPT_TEXTS[index % PROMPT_TEXTS.length],
    topic: TOPICS[index % TOPICS.length],
    ipAddress: `192.168.${randomNumber(1, 255)}.${randomNumber(1, 255)}`,
    tags: [
      randomElement(["research", "comparison", "review", "recommendation"]),
      randomElement(["consumer", "business", "enterprise", "personal"])
    ],
    isScheduled: Math.random() > 0.3,
    isActive: Math.random() > 0.2
  };
}

function generateDummyPromptRun(
  workspaceId: mongoose.Types.ObjectId,
  promptId: mongoose.Types.ObjectId
) {
  const status = randomElement(["COMPLETED", "COMPLETED", "COMPLETED", "FAILED"]) as "COMPLETED" | "FAILED";
  
  return {
    workspaceId,
    promptId,
    runAt: randomDate(30),
    status,
    createdAt: randomDate(30),
    updatedAt: randomDate(30)
  };
}

function generateDummyModelResponse(
  workspaceId: mongoose.Types.ObjectId,
  promptRunId: mongoose.Types.ObjectId,
  brandIds: mongoose.Types.ObjectId[],
  modelName: string
) {
  const selectedBrands = brandIds
    .sort(() => Math.random() - 0.5)
    .slice(0, randomNumber(2, Math.min(5, brandIds.length)));

  const responseTexts = [
    "Based on current clinical research and patient outcomes, GLP-1 receptor agonists have shown remarkable effectiveness for weight management. Medications like semaglutide (Ozempic, Wegovy) and tirzepatide (Mounjaro, Zepbound) have demonstrated significant weight loss results in clinical trials, with patients losing an average of 15-20% of their body weight. These medications work by mimicking the GLP-1 hormone, which helps regulate appetite and food intake. It's important to note that these should be used under medical supervision and are typically prescribed alongside lifestyle modifications including diet and exercise.",
    "When comparing weight loss medications, several FDA-approved options stand out for their efficacy and safety profiles. Semaglutide-based medications have shown superior results in multiple clinical studies, with Wegovy specifically approved for chronic weight management. Tirzepatide offers a dual-action mechanism targeting both GLP-1 and GIP receptors, potentially providing enhanced weight loss benefits. Traditional options like Orlistat work differently by blocking fat absorption, while combination medications like Contrave (naltrexone-bupropion) target neural pathways involved in appetite regulation. The choice of medication should be individualized based on patient health status, weight loss goals, and potential side effects.",
    "For individuals seeking pharmaceutical interventions for weight management, several evidence-based options are available. The newest class of medications, GLP-1 receptor agonists including Ozempic, Wegovy, Mounjaro, and Saxenda, have revolutionized obesity treatment with their impressive efficacy rates. These medications not only promote significant weight loss but also offer additional metabolic benefits such as improved blood sugar control and cardiovascular risk reduction. Older medications like Phentermine and Orlistat remain viable options for certain patients, particularly those looking for more affordable alternatives. However, all weight loss medications should be viewed as tools to complement comprehensive lifestyle changes rather than standalone solutions.",
    "The landscape of weight loss pharmacotherapy has evolved significantly with the introduction of GLP-1 receptor agonists. Medications such as Semaglutide (available as Ozempic for diabetes and Wegovy for weight loss) and Tirzepatide (Mounjaro, Zepbound) represent the most effective pharmaceutical options currently available, with clinical trials demonstrating weight loss of 15-22% of total body weight. These medications work by enhancing satiety, slowing gastric emptying, and reducing appetite through central nervous system mechanisms. While highly effective, patients should be aware of potential side effects including nausea, gastrointestinal discomfort, and the need for ongoing treatment. Insurance coverage and cost can also be significant considerations, as these medications can be expensive without coverage.",
    "When evaluating medications for weight management, it's essential to consider both efficacy and safety profiles. The GLP-1 agonist class, including brands like Wegovy, Ozempic, Saxenda, and newer options like Mounjaro and Zepbound, have shown the most substantial weight loss results in clinical studies. These medications are particularly beneficial for individuals with obesity-related comorbidities such as type 2 diabetes or cardiovascular disease. Alternative options include lipase inhibitors like Orlistat (Xenical, Alli) which prevent fat absorption, and combination therapies like Qsymia (phentermine-topiramate) which work through appetite suppression and metabolic enhancement. The optimal choice depends on individual health factors, contraindications, cost considerations, and patient preferences regarding administration method (injection vs. oral medication)."
  ];

  return {
    workspaceId,
    promptRunId,
    modelName,
    identifiedBrands: selectedBrands,
    responseText: randomElement(responseTexts),
    latencyMs: randomNumber(500, 3000),
    tokenUsage: {
      prompt_tokens: randomNumber(50, 200),
      completion_tokens: randomNumber(200, 800),
      total_tokens: randomNumber(250, 1000)
    },
    audit_summary: {
      total_brands_detected: selectedBrands.length,
      implied_user_persona: randomElement([
        "Tech-savvy consumer",
        "Budget-conscious buyer",
        "Quality-focused professional",
        "Early adopter"
      ]),
      winning_brand: DUMMY_BRANDS[randomNumber(0, DUMMY_BRANDS.length - 1)],
      winning_factor: [
        randomElement(["Price", "Quality", "Features", "Brand reputation"]),
        randomElement(["Customer service", "Availability", "Innovation"])
      ],
      missing_content_assets: [
        {
          asset_type: "Product comparison chart",
          competitor_example: "competitor.com/compare",
          priority: randomElement(["High", "Medium", "Low"]),
          impact: "Could improve decision-making process"
        }
      ],
      predicted_follow_up_topics: [
        "Pricing details",
        "Where to buy",
        "User reviews"
      ],
      conversion_killers: [
        randomElement([
          "Limited availability",
          "High price point",
          "Lack of user reviews",
          "Complex checkout process"
        ])
      ],
      negative_risks: [],
      hallucination_flags: []
    },
    createdAt: randomDate(30),
    updatedAt: randomDate(30)
  };
}

function generateDummyTargetBrand(workspaceId: mongoose.Types.ObjectId, brandName: string, isMain: boolean = false) {
  return {
    workspaceId,
    brand_name: brandName,
    official_url: `https://www.${brandName.toLowerCase().replace(/\s+/g, '')}.com`,
    actual_brand_name: brandName,
    brand_type: randomElement(["Product", "Service", "Platform", "Enterprise"]),
    brand_description: `Leading ${brandName} brand known for quality and innovation in the industry.`,
    mainBrand: isMain,
    isActive: Math.random() > 0.1,
    isScheduled: Math.random() > 0.5,
    mentions: randomNumber(10, 200),
    createdAt: randomDate(90),
    updatedAt: randomDate(30)
  };
}

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB\n");

    // Get existing workspace (don't create new one)
    console.log("🔍 Finding existing workspace...");
    const workspace = await Workspace.findOne({ isDefault: true });
    
    if (!workspace) {
      throw new Error("No default workspace found. Please ensure you have a workspace in your database.");
    }

    console.log(`✅ Using workspace: ${workspace.name} (${workspace._id})\n`);

    const workspaceId = workspace._id as mongoose.Types.ObjectId;

    // Clear existing data for this workspace only
    console.log("🗑️  Clearing existing seeded data...");
    await Brand.deleteMany({ workspaceId });
    await Prompt.deleteMany({ workspaceId });
    await PromptRun.deleteMany({ workspaceId });
    await ModelResponse.deleteMany({ workspaceId });
    await TargetBrand.deleteMany({ workspaceId });
    console.log("✅ Cleared old data\n");

    // 1. Create Target Brands
    console.log("📊 Creating Target Brands...");
    const targetBrands = [];
    const numTargetBrands = randomNumber(5, 8);
    for (let i = 0; i < numTargetBrands; i++) {
      const targetBrand = generateDummyTargetBrand(
        workspaceId,
        DUMMY_BRANDS[i],
        i === 0 // First one is main brand
      );
      targetBrands.push(targetBrand);
    }
    const createdTargetBrands = await TargetBrand.insertMany(targetBrands);
    console.log(`✅ Created ${createdTargetBrands.length} target brands\n`);

    // 2. Create Brands with historical data
    console.log("🏢 Creating Brands...");
    const brands = [];
    const numBrands = randomNumber(20, 30);
    for (let i = 0; i < Math.min(numBrands, DUMMY_BRANDS.length); i++) {
      const brand = generateDummyBrand(workspaceId, DUMMY_BRANDS[i], i);
      brands.push(brand);
    }
    const createdBrands = await Brand.insertMany(brands);
    console.log(`✅ Created ${createdBrands.length} brands\n`);

    // 3. Create Prompts
    console.log("💬 Creating Prompts...");
    const prompts = [];
    for (let i = 0; i < 3; i++) {
      const prompt = generateDummyPrompt(workspaceId, i);
      prompts.push(prompt);
    }
    const createdPrompts = await Prompt.insertMany(prompts);
    console.log(`✅ Created ${createdPrompts.length} prompts\n`);

    // 4. Create Prompt Runs & Model Responses
    console.log("🤖 Creating Prompt Runs and Model Responses...");
    let totalPromptRuns = 0;
    let totalModelResponses = 0;

    for (const prompt of createdPrompts) {
      const numRuns = randomNumber(3, 8);
      
      for (let i = 0; i < numRuns; i++) {
        const promptRun = generateDummyPromptRun(workspaceId, prompt._id as mongoose.Types.ObjectId);
        const createdPromptRun = await PromptRun.create(promptRun);
        totalPromptRuns++;

        if (promptRun.status === "COMPLETED") {
          // Use all 3 AI models for each completed run
          for (const model of AI_MODELS) {
            const modelResponse = generateDummyModelResponse(
              workspaceId,
              createdPromptRun._id as mongoose.Types.ObjectId,
              createdBrands.map(b => b._id as mongoose.Types.ObjectId),
              model
            );
            await ModelResponse.create(modelResponse);
            totalModelResponses++;
          }
        }
      }
    }

    console.log(`✅ Created ${totalPromptRuns} prompt runs`);
    console.log(`✅ Created ${totalModelResponses} model responses\n`);

    // Summary
    console.log("=".repeat(50));
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log(`📊 Target Brands: ${createdTargetBrands.length}`);
    console.log(`🏢 Brands: ${createdBrands.length}`);
    console.log(`💬 Prompts: ${createdPrompts.length}`);
    console.log(`🔄 Prompt Runs: ${totalPromptRuns}`);
    console.log(`🤖 Model Responses: ${totalModelResponses}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the seed function
seedDatabase();
