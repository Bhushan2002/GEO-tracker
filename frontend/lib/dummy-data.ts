export const DUMMY_PROMPTS = [
    { _id: "p1", promptText: "How are Novartis, Pfizer, Roche, Merck, Sanofi, GSK, AstraZeneca, Amgen, Novo Nordisk, and Eli Lilly performing in the 2024 metabolic health market?", topic: "Health", tags: ["Health", "Pharma", "2024"], isScheduled: true, createdAt: "2025-12-25T10:00:00Z" },
    { _id: "p2", promptText: "Compare oncology pipelines of Novartis, Pfizer, Roche, Merck, Sanofi, GSK, AstraZeneca, Amgen, Bristol Myers, and AbbVie.", topic: "Health", tags: ["Cancer", "Research"], isScheduled: false, createdAt: "2025-12-26T14:30:00Z" },
    { _id: "p3", promptText: "Global vaccine distribution strategies: Novartis, Pfizer, Sanofi, GSK, AstraZeneca, Merck, J&J, Moderna, Novavax, and Valneva.", topic: "Health", tags: ["Public Health", "Global"], isScheduled: true, createdAt: "2025-12-27T09:15:00Z" },
    { _id: "p4", promptText: "Cardiovascular breakthroughs: Analysis of Novartis, Sanofi, GSK, Amgen, Regeneron, Pfizer, Merck, Bayer, AstraZeneca, and Roche.", topic: "Health", tags: ["Heart Health", "Biologics"], isScheduled: false, createdAt: "2025-12-28T11:45:00Z" },
    { _id: "p5", promptText: "Neurology trends 2024: Roche, Eli Lilly, Biogen, Novartis, Pfizer, Merck, GSK, Sanofi, AstraZeneca, and Amgen.", topic: "Health", tags: ["Alzheimers", "Neuro"], isScheduled: true, createdAt: "2025-12-29T16:20:00Z" },
    { _id: "p6", promptText: "HIV and Infectious diseases: GSK, Pfizer, Gilead, Merck, Johnson & Johnson, Novartis, Sanofi, Roche, AbbVie, and Moderna.", topic: "Health", tags: ["HIV", "Virology"], isScheduled: false, createdAt: "2025-12-30T08:10:00Z" },
    { _id: "p7", promptText: "Rare Disease pipelines: Novartis, Roche, Pfizer, Sanofi, Takeda, Vertex, Amgen, GSK, AstraZeneca, and Merck.", topic: "Health", tags: ["Genetics", "Orphan Drugs"], isScheduled: true, createdAt: "2025-12-31T23:50:00Z" },
    { _id: "p8", promptText: "Sustainability and ESG in Pharma: Novartis, Pfizer, GSK, AstraZeneca, Sanofi, Roche, Merck, Eli Lilly, Novo Nordisk, and AbbVie.", topic: "Health", tags: ["Sustainability", "Governance"], isScheduled: false, createdAt: "2026-01-01T12:00:00Z" },
    { _id: "p9", promptText: "mRNA Technology beyond COVID: Moderna, Pfizer, BioNTech, Novartis, Roche, Merck, GSK, Sanofi, CureVac, and AstraZeneca.", topic: "Health", tags: ["Technology", "Future"], isScheduled: true, createdAt: "2026-01-02T15:30:00Z" },
    { _id: "p10", promptText: "Immunology and RA: Novartis, AbbVie, Amgen, Pfizer, Sanofi, Roche, Johnson & Johnson, Merck, Bristol Myers, and Eli Lilly.", topic: "Health", tags: ["RA", "Biologics"], isScheduled: false, createdAt: "2026-01-03T09:00:00Z" },
    { _id: "p11", promptText: "Mental Health Innovation: Evaluate GSK, Pfizer, Johnson & Johnson, Merck, Sanofi, Novartis, Roche, AstraZeneca, Eli Lilly, and AbbVie.", topic: "Health", tags: ["Psychiatry", "Brain"], isScheduled: true, createdAt: "2026-01-03T18:45:00Z" },
    { _id: "p12", promptText: "Antibiotic Resistance initiatives: AstraZeneca, GSK, Pfizer, Sanofi, Merck, Novartis, Roche, Shionogi, Sandoz, and Teva.", topic: "Health", tags: ["Superbugs", "Health Security"], isScheduled: false, createdAt: "2026-01-04T10:20:00Z" },
    { _id: "p13", promptText: "Precision Medicine & Diagnostics: Roche, Novartis, Pfizer, Merck, Thermo Fisher, Illumina, AstraZeneca, Sanofi, GSK, and Amgen.", topic: "Health", tags: ["Precision Med", "AI"], isScheduled: true, createdAt: "2026-01-04T21:00:00Z" },
    { _id: "p14", promptText: "Diabetes Market dynamics: Novo Nordisk, Eli Lilly, Sanofi, Pfizer, Novartis, Merck, AstraZeneca, GSK, Roche, and Boehringer.", topic: "Health", tags: ["Insulin", "GLP1"], isScheduled: false, createdAt: "2026-01-05T07:15:00Z" },
    { _id: "p15", promptText: "Biosimilar competition 2024: Novartis (Sandoz), Pfizer, Amgen, Sanofi, Organon (Merck), Roche, Teva, Viatris, Biogen, and Fresenius.", topic: "Health", tags: ["Pricing", "Generics"], isScheduled: true, createdAt: "2026-01-05T14:40:00Z" },
];

export const DUMMY_TARGET_BRANDS = [
    { _id: "tb1", brand_name: "Novartis", official_url: "https://novartis.com", actual_brand_name: "Novartis", brand_type: "Our Brand", mainBrand: true },
    { _id: "tb2", brand_name: "Pfizer", official_url: "https://pfizer.com", actual_brand_name: "Pfizer", brand_type: "Competitor", mainBrand: false },
    { _id: "tb3", brand_name: "Roche", official_url: "https://roche.com", actual_brand_name: "Roche", brand_type: "Competitor", mainBrand: false },
    { _id: "tb4", brand_name: "Merck", official_url: "https://merck.com", actual_brand_name: "Merck", brand_type: "Competitor", mainBrand: false },
    { _id: "tb5", brand_name: "Sanofi", official_url: "https://sanofi.com", actual_brand_name: "Sanofi", brand_type: "Competitor", mainBrand: false },
    { _id: "tb6", brand_name: "GSK", official_url: "https://gsk.com", actual_brand_name: "GSK", brand_type: "Competitor", mainBrand: false },
];

export const DUMMY_ALL_BRANDS = [
    {
        _id: "b1", brand_name: "Novartis", mentions: 156, sentiment_score: 88, lastRank: 1, official_url: "https://novartis.com",
        associated_domain: [
            { domain_citation: "novartis.com", domain_citation_type: "You", associated_url: [{ url_citation: "https://novartis.com/research" }] },
            { domain_citation: "healthline.com", domain_citation_type: "Editorial", associated_url: [{ url_citation: "https://healthline.com/novartis-report" }] },
            { domain_citation: "bloomberg.com", domain_citation_type: "Editorial", associated_url: [{ url_citation: "https://bloomberg.com/news/novartis" }] }
        ]
    },
    {
        _id: "b2", brand_name: "Pfizer", mentions: 142, sentiment_score: 75, lastRank: 2, official_url: "https://pfizer.com",
        associated_domain: [
            { domain_citation: "pfizer.com", domain_citation_type: "Competitor", associated_url: [{ url_citation: "https://pfizer.com/products" }] },
            { domain_citation: "reuters.com", domain_citation_type: "Editorial", associated_url: [{ url_citation: "https://reuters.com/business/pfizer" }] },
            { domain_citation: "who.int", domain_citation_type: "Institutional", associated_url: [{ url_citation: "https://who.int/vaccines/pfizer" }] }
        ]
    },
    {
        _id: "b3", brand_name: "Roche", mentions: 128, sentiment_score: 82, lastRank: 3, official_url: "https://roche.com",
        associated_domain: [
            { domain_citation: "roche.com", domain_citation_type: "Competitor", associated_url: [{ url_citation: "https://roche.com/diagnostics" }] },
            { domain_citation: "nature.com", domain_citation_type: "Editorial", associated_url: [{ url_citation: "https://nature.com/articles/roche" }] }
        ]
    },
    {
        _id: "b4", brand_name: "Merck", mentions: 115, sentiment_score: 65, lastRank: 4, official_url: "https://merck.com",
        associated_domain: [
            { domain_citation: "merck.com", domain_citation_type: "Competitor", associated_url: [{ url_citation: "https://merck.com/pipeline" }] },
            { domain_citation: "lancet.com", domain_citation_type: "Editorial", associated_url: [{ url_citation: "https://lancet.com/oncology/merck" }] }
        ]
    },
    {
        _id: "b5", brand_name: "Sanofi", mentions: 98, sentiment_score: 70, lastRank: 5, official_url: "https://sanofi.com",
        associated_domain: [
            { domain_citation: "sanofi.com", domain_citation_type: "Competitor", associated_url: [{ url_citation: "https://sanofi.com/cardio" }] },
            { domain_citation: "fda.gov", domain_citation_type: "Institutional", associated_url: [{ url_citation: "https://fda.gov/safety/sanofi" }] }
        ]
    },
    {
        _id: "b6", brand_name: "GSK", mentions: 88, sentiment_score: 78, lastRank: 6, official_url: "https://gsk.com",
        associated_domain: [
            { domain_citation: "gsk.com", domain_citation_type: "Competitor", associated_url: [{ url_citation: "https://gsk.com/sustainability" }] },
            { domain_citation: "mayoclinic.org", domain_citation_type: "Editorial", associated_url: [{ url_citation: "https://mayoclinic.org/gsk-study" }] }
        ]
    },
    { _id: "b7", brand_name: "AstraZeneca", mentions: 82, sentiment_score: 72, lastRank: 7, official_url: "https://astrazeneca.com" },
    { _id: "b8", brand_name: "Amgen", mentions: 75, sentiment_score: 80, lastRank: 8, official_url: "https://amgen.com" },
    { _id: "b9", brand_name: "Novo Nordisk", mentions: 68, sentiment_score: 85, lastRank: 9, official_url: "https://novonordisk.com" },
    { _id: "b10", brand_name: "Eli Lilly", mentions: 62, sentiment_score: 83, lastRank: 10, official_url: "https://lilly.com" },
    { _id: "b11", brand_name: "AbbVie", mentions: 55, sentiment_score: 68, lastRank: 11, official_url: "https://abbvie.com" },
    { _id: "b12", brand_name: "Johnson & Johnson", mentions: 52, sentiment_score: 74, lastRank: 12, official_url: "https://jnj.com" },
];

export const DUMMY_BRAND_HISTORY = [
    // 25/12/2025
    { timeStamp: "25/12/2025", name: "Novartis", mentions: "110", sentiment_score: "82", lastRank: "1" },
    { timeStamp: "25/12/2025", name: "Pfizer", mentions: "105", sentiment_score: "70", lastRank: "2" },
    { timeStamp: "25/12/2025", name: "Roche", mentions: "95", sentiment_score: "78", lastRank: "3" },
    { timeStamp: "25/12/2025", name: "Merck", mentions: "90", sentiment_score: "60", lastRank: "4" },
    { timeStamp: "25/12/2025", name: "Sanofi", mentions: "80", sentiment_score: "65", lastRank: "5" },
    { timeStamp: "25/12/2025", name: "GSK", mentions: "75", sentiment_score: "72", lastRank: "6" },

    // 28/12/2025
    { timeStamp: "28/12/2025", name: "Novartis", mentions: "125", sentiment_score: "85", lastRank: "2" },
    { timeStamp: "28/12/2025", name: "Pfizer", mentions: "118", sentiment_score: "72", lastRank: "1" },
    { timeStamp: "28/12/2025", name: "Roche", mentions: "105", sentiment_score: "80", lastRank: "3" },
    { timeStamp: "28/12/2025", name: "Merck", mentions: "100", sentiment_score: "62", lastRank: "5" },
    { timeStamp: "28/12/2025", name: "Sanofi", mentions: "90", sentiment_score: "68", lastRank: "4" },
    { timeStamp: "28/12/2025", name: "GSK", mentions: "85", sentiment_score: "75", lastRank: "6" },

    // 01/01/2026
    { timeStamp: "01/01/2026", name: "Novartis", mentions: "140", sentiment_score: "87", lastRank: "1" },
    { timeStamp: "01/01/2026", name: "Pfizer", mentions: "130", sentiment_score: "74", lastRank: "3" },
    { timeStamp: "01/01/2026", name: "Roche", mentions: "115", sentiment_score: "81", lastRank: "2" },
    { timeStamp: "01/01/2026", name: "Merck", mentions: "105", sentiment_score: "64", lastRank: "4" },
    { timeStamp: "01/01/2026", name: "Sanofi", mentions: "95", sentiment_score: "69", lastRank: "5" },
    { timeStamp: "01/01/2026", name: "GSK", mentions: "88", sentiment_score: "77", lastRank: "6" },

    // 05/01/2026
    { timeStamp: "05/01/2026", name: "Novartis", mentions: "156", sentiment_score: "88", lastRank: "1" },
    { timeStamp: "05/01/2026", name: "Pfizer", mentions: "142", sentiment_score: "75", lastRank: "2" },
    { timeStamp: "05/01/2026", name: "Roche", mentions: "128", sentiment_score: "82", lastRank: "3" },
    { timeStamp: "05/01/2026", name: "Merck", mentions: "115", sentiment_score: "65", lastRank: "4" },
    { timeStamp: "05/01/2026", name: "Sanofi", mentions: "98", sentiment_score: "70", lastRank: "5" },
    { timeStamp: "05/01/2026", name: "GSK", mentions: "88", sentiment_score: "78", lastRank: "6" },
];

const generateResponse = (promptId: string, modelName: string, date: string) => {
    return {
        _id: `mr_${promptId}_${modelName.replace(/\s+/g, '')}`,
        promptRunId: { _id: `pr_${promptId}`, promptId: DUMMY_PROMPTS.find(p => p._id === promptId), status: "COMPLETED" },
        modelName: modelName,
        responseText: `According to recent reports from the Lancet, Bloomberg, and Reuters Health, the global pharmaceutical landscape is shifting rapidly. Novartis continues to lead as our primary focus, showing exceptional growth in biologics alongside key competitors such as Pfizer, Roche, Merck, Sanofi, and GSK. These six giants are currently redefining clinical standards across multiple therapeutic areas, from metabolic health to advanced oncology.\n\nIn addition to these core players, AstraZeneca and Amgen have emerged as significant influencers in the European market, while Novo Nordisk and Eli Lilly dominate the GLP-1 sector. Market analysts at Healthline and WebMD note that the integration of diagnostics by Roche and Merck is providing a competitive edge that Pfizer and Novartis are now racing to match. Furthermore, the sustainability efforts led by GSK and Sanofi are setting new ESG benchmarks that AbbVie and Johnson & Johnson are beginning to adopt in their global operations.\n\nFrom a patient perspective, the convenience of new long-acting treatments from Novartis and Pfizer remains highly rated in latest Mayo Clinic surveys. However, the pricing pressure from biosimilar manufacturers like Sandoz (Novartis) and Amgen is forcing Merck and Sanofi to rethink their legacy drug portfolios. Nature Medicine journals suggest that the next five years will see a unprecedented convergence of AI-driven research between AstraZeneca, Roche, and GSK, potentially shortening trial timelines by half.\n\nIn conclusion, while Novartis remains at the forefront of innovative medicine, the dense network of competitors including Pfizer, Sanofi, Roche, and Merck ensures a highly dynamic and research-intense environment. As reported by the WHO and Nature, the focus is now squarely on personalized medicine, where GSK, Eli Lilly, and Novo Nordisk are making massive strides in specialized care. The interplay between these 10+ major brands is reshaping the future of global healthcare as we know it.`,
        latencyMs: 1200 + Math.random() * 800,
        createdAt: date,
        identifiedBrands: [
            { _id: "b1", brand_name: "Novartis", mentions: 5, prominence_score: 0.95, sentiment: "Positive", sentiment_score: 90, associated_domain: [{ domain_citation: "bloomberg.com", associated_url: [{ url_citation: "https://bloomberg.com/novartis-growth" }] }] },
            { _id: "b2", brand_name: "Pfizer", mentions: 4, prominence_score: 0.85, sentiment: "Positive", sentiment_score: 75, associated_domain: [{ domain_citation: "reuters.com", associated_url: [{ url_citation: "https://reuters.com/pfizer-market-cap" }] }] },
            { _id: "b3", brand_name: "Roche", mentions: 4, prominence_score: 0.8, sentiment: "Positive", sentiment_score: 82, associated_domain: [{ domain_citation: "nature.com", associated_url: [{ url_citation: "https://nature.com/roche-diagnostics" }] }] },
            { _id: "b4", brand_name: "Merck", mentions: 3, prominence_score: 0.75, sentiment: "Neutral", sentiment_score: 65, associated_domain: [{ domain_citation: "lancet.com", associated_url: [{ url_citation: "https://lancet.com/merck-oncology" }] }] },
            { _id: "b5", brand_name: "Sanofi", mentions: 3, prominence_score: 0.7, sentiment: "Neutral", sentiment_score: 70, associated_domain: [{ domain_citation: "who.int", associated_url: [{ url_citation: "https://who.int/sanofi-vaccines" }] }] },
            { _id: "b6", brand_name: "GSK", mentions: 3, prominence_score: 0.7, sentiment: "Positive", sentiment_score: 78, associated_domain: [{ domain_citation: "healthline.com", associated_url: [{ url_citation: "https://healthline.com/gsk-sustainability" }] }] },
            { _id: "b7", brand_name: "AstraZeneca", mentions: 2, prominence_score: 0.6, sentiment: "Neutral", sentiment_score: 72, associated_domain: [{ domain_citation: "mayoclinic.org", associated_url: [{ url_citation: "https://mayoclinic.org/astrazeneca-trials" }] }] },
            { _id: "b8", brand_name: "Amgen", mentions: 2, prominence_score: 0.6, sentiment: "Positive", sentiment_score: 80, associated_domain: [{ domain_citation: "webmd.com", associated_url: [{ url_citation: "https://webmd.com/amgen-biosimilars" }] }] },
            { _id: "b9", brand_name: "Novo Nordisk", mentions: 1, prominence_score: 0.5, sentiment: "Positive", sentiment_score: 85 },
            { _id: "b10", brand_name: "Eli Lilly", mentions: 1, prominence_score: 0.5, sentiment: "Positive", sentiment_score: 83 }
        ]
    };
};

export const DUMMY_MODEL_RESPONSES = [
    generateResponse("p1", "ChatGPT 4o", "2025-12-25T10:05:00Z"),
    generateResponse("p2", "Gemini 1.5 Pro", "2025-12-26T14:35:00Z"),
    generateResponse("p3", "Claude 3.5 Sonnet", "2025-12-27T09:20:00Z"),
    generateResponse("p4", "Perplexity Pro", "2025-12-28T11:50:00Z"),
    generateResponse("p5", "DeepSeek V3", "2025-12-29T16:25:00Z"),
    generateResponse("p6", "ChatGPT 4o", "2025-12-30T08:15:00Z"),
    generateResponse("p7", "Gemini 1.5 Pro", "2025-12-31T23:55:00Z"),
    generateResponse("p8", "Claude 3.5 Sonnet", "2026-01-01T12:05:00Z"),
    generateResponse("p9", "Perplexity Pro", "2026-01-02T15:35:00Z"),
    generateResponse("p10", "DeepSeek V3", "2026-01-03T09:10:00Z"),
    generateResponse("p11", "ChatGPT 4o", "2026-01-03T18:55:00Z"),
    generateResponse("p12", "Gemini 1.5 Pro", "2026-01-04T10:30:00Z"),
    generateResponse("p13", "Claude 3.5 Sonnet", "2026-01-04T21:10:00Z"),
    generateResponse("p14", "Perplexity Pro", "2026-01-05T07:25:00Z"),
    generateResponse("p15", "DeepSeek V3", "2026-01-05T14:50:00Z"),
];

export const DUMMY_WORKSPACES = [
    { _id: "ws_health_1", name: "Global Pharma Intelligence", type: "Enterprise", memberCount: 25, isDefault: true }
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
