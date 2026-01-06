
import { addDays, format, startOfDay } from "date-fns";

// --- 1. DEFINITIONS ---

export const DUMMY_PROMPTS = [
    { _id: "p1", promptText: "How are Novartis, Pfizer, and Roche performing in the 2024 metabolic health market?", topic: "Health", tags: ["Health", "Pharma", "2024"], isScheduled: true, createdAt: "2025-12-25T10:00:00Z" },
    { _id: "p2", promptText: "Compare oncology pipelines of Novartis, Merck, and AstraZeneca.", topic: "Health", tags: ["Cancer", "Research"], isScheduled: true, createdAt: "2025-12-25T14:30:00Z" },
    { _id: "p3", promptText: "Global vaccine distribution strategies: Novartis, Sanofi, and GSK.", topic: "Health", tags: ["Public Health", "Global"], isScheduled: true, createdAt: "2025-12-25T09:15:00Z" },
    { _id: "p4", promptText: "Neurology trends 2024: Roche, Eli Lilly, and Novartis.", topic: "Health", tags: ["Alzheimers", "Neuro"], isScheduled: true, createdAt: "2025-12-25T16:20:00Z" },
    { _id: "p5", promptText: "Sustainability and ESG in Pharma: Novartis, Pfizer, and GSK.", topic: "Health", tags: ["Sustainability", "Governance"], isScheduled: true, createdAt: "2025-12-25T12:00:00Z" },
    { _id: "p6", promptText: "mRNA Technology beyond COVID: Moderna, Pfizer, and Novartis.", topic: "Health", tags: ["Technology", "Future"], isScheduled: true, createdAt: "2025-12-25T15:30:00Z" },
    { _id: "p7", promptText: "Diabetes Market dynamics: Novo Nordisk, Eli Lilly, and Novartis.", topic: "Health", tags: ["Insulin", "GLP1"], isScheduled: true, createdAt: "2025-12-25T07:15:00Z" },
    { _id: "p8", promptText: "Biosimilar competition 2024: Novartis (Sandoz) vs Amgen.", topic: "Health", tags: ["Pricing", "Generics"], isScheduled: true, createdAt: "2025-12-25T14:40:00Z" },
];

export const DUMMY_TARGET_BRANDS = [
    { _id: "tb1", brand_name: "Novartis", official_url: "https://novartis.com", actual_brand_name: "Novartis", brand_type: "Our Brand", mainBrand: true },
    { _id: "tb2", brand_name: "Pfizer", official_url: "https://pfizer.com", actual_brand_name: "Pfizer", brand_type: "Competitor", mainBrand: false },
    { _id: "tb3", brand_name: "Roche", official_url: "https://roche.com", actual_brand_name: "Roche", brand_type: "Competitor", mainBrand: false },
    { _id: "tb4", brand_name: "Merck", official_url: "https://merck.com", actual_brand_name: "Merck", brand_type: "Competitor", mainBrand: false },
    { _id: "tb5", brand_name: "Sanofi", official_url: "https://sanofi.com", actual_brand_name: "Sanofi", brand_type: "Competitor", mainBrand: false },
    { _id: "tb6", brand_name: "GSK", official_url: "https://gsk.com", actual_brand_name: "GSK", brand_type: "Competitor", mainBrand: false },
    { _id: "tb7", brand_name: "AstraZeneca", official_url: "https://astrazeneca.com", actual_brand_name: "AstraZeneca", brand_type: "Competitor", mainBrand: false },
    { _id: "tb8", brand_name: "Amgen", official_url: "https://amgen.com", actual_brand_name: "Amgen", brand_type: "Competitor", mainBrand: false },
    { _id: "tb9", brand_name: "Novo Nordisk", official_url: "https://novonordisk.com", actual_brand_name: "Novo Nordisk", brand_type: "Competitor", mainBrand: false },
    { _id: "tb10", brand_name: "Eli Lilly", official_url: "https://lilly.com", actual_brand_name: "Eli Lilly", brand_type: "Competitor", mainBrand: false },
];

// Potential domains to cite
const DOMAIN_POOL = [
    { domain: "novartis.com", type: "You" },
    { domain: "pfizer.com", type: "Competitor" },
    { domain: "roche.com", type: "Competitor" },
    { domain: "healthline.com", type: "Editorial" },
    { domain: "bloomberg.com", type: "Editorial" },
    { domain: "reuters.com", type: "Editorial" },
    { domain: "nature.com", type: "Editorial" },
    { domain: "who.int", type: "Institutional" },
    { domain: "fda.gov", type: "Institutional" },
    { domain: "mayoclinic.org", type: "Institutional" },
    { domain: "webmd.com", type: "Editorial" },
    { domain: "reddit.com", type: "UGC" },
    { domain: "twitter.com", type: "UGC" },
    { domain: "linkedin.com", type: "UGC" },
];

// --- 2. GENERATORS ---

function generateDates(start: Date, days: number) {
    const dates = [];
    for (let i = 0; i < days; i++) {
        dates.push(addDays(start, i));
    }
    return dates;
}

const START_DATE = new Date("2025-12-25T00:00:00Z");
const DATES = generateDates(START_DATE, 12); // Dec 25 to Jan 5

// Generate Model Responses
const MODELS = ["ChatGPT 4o", "Gemini 1.5 Pro", "Claude 3.5 Sonnet", "Perplexity Pro", "DeepSeek V3"];

export const DUMMY_MODEL_RESPONSES: any[] = [];
export const DUMMY_BRAND_HISTORY: any[] = [];

// Helper to get random subset
const getRandomSubset = (arr: any[], count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Populate Data
DATES.forEach((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "dd/MM/yyyy");

    // 1. Generate Prompt Runs for this day (Simulate 6-8 prompts running daily)
    const promptsRunningToday = getRandomSubset(DUMMY_PROMPTS, Math.floor(Math.random() * 3) + 6);

    promptsRunningToday.forEach((prompt: any) => {
        const model = MODELS[Math.floor(Math.random() * MODELS.length)];
        const identifiedBrands: any[] = [];

        // Ensure RICH DATA: 5-8 brands mentioned per response
        const mentionedBrands = getRandomSubset(DUMMY_TARGET_BRANDS, Math.floor(Math.random() * 4) + 5);

        mentionedBrands.forEach((brand: any, idx: number) => {
            // Ensure RICH DATA: 4-5 citations per brand
            const brandDomains = getRandomSubset(DOMAIN_POOL, Math.floor(Math.random() * 2) + 4);
            const formattedDomains = brandDomains.map((d: any, i: number) => ({
                domain_citation: d.domain,
                domain_citation_type: d.type,
                associated_url: [{ url_citation: `https://${d.domain}/article/${brand.brand_name.toLowerCase()}-report-${format(date, 'MM-dd')}-${i}` }]
            }));

            identifiedBrands.push({
                _id: `b_${prompt._id}_${brand._id}_${date.getTime()}`,
                brand_name: brand.brand_name,
                mentions: Math.floor(Math.random() * 8) + 2, // Higher mentions count
                prominence_score: (0.95 - (idx * 0.08)).toFixed(2),
                sentiment: Math.random() > 0.3 ? "Positive" : "Neutral",
                sentiment_score: 70 + Math.floor(Math.random() * 25),
                associated_domain: formattedDomains
            });
        });

        const responseParagraphs = [
            `According to recent findings on ${dateStr}, the 2024 landscape for ${prompt.topic} is evolving rapidly. Key players like ${mentionedBrands.slice(0, 3).map((b: any) => b.brand_name).join(", ")} are leading with significant R&D investments, as highlighted in reports from Healthline and Reuters.`,
            `Competitor analysis reveals that ${mentionedBrands[3]?.brand_name || 'Sanofi'} and ${mentionedBrands[4]?.brand_name || 'GSK'} represent a growing threat in the biologics sector. Their new pipeline updates suggest a direct challenge to Novartis's market share properly cited by FDA and WHO guidelines.`,
            `Furthermore, market sentiment remains strong for ${mentionedBrands[0].brand_name}, driven by robust clinical trial results published in Nature and The Lancet. In contrast, pricing pressures discussed on Bloomberg continue to impact the broader sector's profitability margins for the upcoming quarter.`
        ];

        // Generate random time between 9 AM and 9 PM for this specific run
        const executionTime = new Date(date);
        executionTime.setHours(9 + Math.floor(Math.random() * 12));
        executionTime.setMinutes(Math.floor(Math.random() * 60));

        DUMMY_MODEL_RESPONSES.push({
            _id: `mr_${prompt._id}_${date.getTime()}`,
            promptRunId: { _id: `pr_${prompt._id}`, promptId: prompt, status: "COMPLETED" },
            modelName: model,
            responseText: responseParagraphs.join("\n\n"),
            latencyMs: 1000 + Math.random() * 2000,
            createdAt: executionTime.toISOString(),
            identifiedBrands: identifiedBrands.sort((a, b) => b.prominence_score - a.prominence_score)
        });
    });

    // 2. Generate Brand History Snapshot for this day (Aggregated mock stats)
    DUMMY_TARGET_BRANDS.slice(0, 6).forEach((brand, idx) => {
        // Daily sway in rank
        const rankSway = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        let rank = idx + 1 + rankSway;
        if (rank < 1) rank = 1;

        DUMMY_BRAND_HISTORY.push({
            timeStamp: displayDate,
            name: brand.brand_name,
            mentions: (50 + Math.random() * 50).toFixed(0),
            sentiment_score: (60 + Math.random() * 30).toFixed(0),
            lastRank: rank.toString()
        });
    });
});


// --- 3. AGGREGATED BRAND STATS (Static snapshot) ---
export const DUMMY_ALL_BRANDS = DUMMY_TARGET_BRANDS.map(brand => {
    return {
        _id: brand._id,
        brand_name: brand.brand_name,
        mentions: Math.floor(Math.random() * 60) + 30, // 30-90% Visibility
        sentiment_score: Math.floor(Math.random() * 30) + 65,
        lastRank: Math.floor(Math.random() * 10) + 1,
        official_url: brand.official_url,
        associated_domain: getRandomSubset(DOMAIN_POOL, 3).map(d => ({
            domain_citation: d.domain,
            domain_citation_type: d.type,
            associated_url: [{ url_citation: `https://${d.domain}/report/${brand.brand_name}` }]
        }))
    }
});


export const DUMMY_WORKSPACES = [
    { _id: "ws_health_1", name: "Creatosaurus's workspace", type: "Enterprise", memberCount: 25, isDefault: true }
];

export const DUMMY_TRAFFIC_DATA = [
    { model: "ChatGPT 4o", traffic: 4500 },
    { model: "Gemini 1.5 Pro", traffic: 3800 },
    { model: "Claude 3.5 Sonnet", traffic: 3200 },
    { model: "Perplexity Pro", traffic: 2800 },
    { model: "DeepSeek V3", traffic: 2100 },
];

export const DUMMY_GA_ACCOUNTS = [
    { _id: "ga1", accountName: "Pharma Marketing", propertyName: "Global Dashboard", propertyId: "12345678", createdAt: new Date().toISOString() }
];

export const DUMMY_GA_REPORT = {
    chartData: [
        { name: "20251225", users: 12000, aiUsers: 4500 },
        { name: "20251228", users: 13500, aiUsers: 5100 },
        { name: "20260101", users: 15800, aiUsers: 6200 },
        { name: "20260105", users: 18200, aiUsers: 7500 },
    ],
    metrics: { activeUsers: 59500, engagedSessions: 42000, keyEvents: 8500 }
};

export const DUMMY_FIRST_TOUCH = [
    { date: "20251225", users: 1200, conversions: 210 },
    { date: "20251228", users: 1450, conversions: 245 },
    { date: "20260101", users: 1800, conversions: 310 },
    { date: "20260105", users: 2100, conversions: 380 },
];

export const DUMMY_ZERO_TOUCH = [
    { date: "20251225", impressions: 125000, brandSearches: 12000 },
    { date: "20251228", impressions: 142000, brandSearches: 13500 },
    { date: "20260101", impressions: 168000, brandSearches: 15800 },
    { date: "20260105", impressions: 195000, brandSearches: 18200 },
];
