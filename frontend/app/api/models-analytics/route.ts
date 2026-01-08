import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { ModelResponse } from "@/lib/models/modelResponse.model";
import { Brand } from "@/lib/models/brand.model";
import { PromptRun } from "@/lib/models/promptRun.model";
import { Prompt } from "@/lib/models/prompt.model"; // Ensure prompt model is registered
import { TargetBrand } from "@/lib/models/targetBrand.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const workspaceId = await getWorkspaceId(request);
        if (!workspaceId) return workspaceError();

        await connectDatabase();

        // 1. Time Periods
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // 2. Fetch all model responses
        const responses = await ModelResponse.find({})
            .populate({
                path: 'identifiedBrands',
                model: Brand
            })
            .populate({
                path: 'promptRunId',
                model: PromptRun,
                select: 'createdAt promptId',
                populate: {
                    path: 'promptId',
                    model: Prompt,
                    select: 'promptText'
                }
            })
            .sort({ createdAt: -1 });

        // 3. Fetch Target Brands
        const targetBrands = await TargetBrand.find({ workspaceId }).select('brand_name');
        const targetBrandSet = new Set(targetBrands.map(b => b.brand_name.toLowerCase()));

        // 4. Helper to Calculate Stats for a subset of responses
        const calculateStats = (subset: any[]) => {
            let totalRuns = 0;
            let totalLatency = 0;
            let sentimentSum = 0;
            let sentimentCount = 0;
            let visibilityCount = 0;
            let totalBrandsFound = 0;
            let sources: Record<string, number> = {};
            let sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };

            subset.forEach((res: any) => {
                totalRuns += 1;
                totalLatency += (res.latencyMs || 0);

                const brands = res.identifiedBrands || [];
                if (brands.length > 0) {
                    totalBrandsFound += brands.length;

                    // Visibility checks
                    let foundTarget = false;
                    brands.forEach((b: any) => {
                        const bName = (b.brand_name || "").toLowerCase();
                        if (targetBrandSet.has(bName)) foundTarget = true;
                    });
                    if (foundTarget) visibilityCount += 1;

                    // Sentiment & Sources
                    brands.forEach((b: any) => {
                        if (typeof b.sentiment_score === 'number') {
                            let score = b.sentiment_score;
                            if (score <= 10) score = score * 10;

                            sentimentSum += score;
                            sentimentCount += 1;

                            if (score >= 60) sentimentDistribution.positive += 1;
                            else if (score <= 40) sentimentDistribution.negative += 1;
                            else sentimentDistribution.neutral += 1;
                        }

                        if (b.associated_domain && Array.isArray(b.associated_domain)) {
                            b.associated_domain.forEach((d: any) => {
                                if (d.domain_citation) {
                                    sources[d.domain_citation] = (sources[d.domain_citation] || 0) + 1;
                                }
                            });
                        }
                    });
                }
            });

            return {
                totalRuns,
                avgLatency: totalRuns > 0 ? Math.round(totalLatency / totalRuns) : 0,
                avgSentiment: sentimentCount > 0 ? Math.round(sentimentSum / sentimentCount) : 0,
                brandPresence: totalRuns > 0 ? Math.round((visibilityCount / totalRuns) * 100) : 0,
                totalBrandsFound,
                sources,
                sentimentDistribution
            };
        };

        // 5. Aggregate by Family
        const targetFamilies = ["ChatGPT", "Gemini", "Claude"];

        const getModelFamily = (rawName: string): string => {
            const lower = rawName.toLowerCase();
            if (lower.includes("gpt")) return "ChatGPT";
            if (lower.includes("gemini") || lower.includes("bard")) return "Gemini";
            if (lower.includes("claude") || lower.includes("anthropic")) return "Claude";
            if (lower.includes("perplexity")) return "Perplexity";
            if (lower.includes("grok")) return "Grok";
            if (lower.includes("copilot") || lower.includes("bing") || lower.includes("microsoft")) return "Copilot";
            if (lower.includes("deepseek")) return "DeepSeek";
            return "Other";
        };

        // Helper for Delta
        const getDelta = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // aggregations
        const result = targetFamilies.map(family => {
            const familyResponses = responses.filter((r: any) => getModelFamily(r.modelName || "") === family);

            // 1. LIFETIME STATS (Cumulative - "stays every data")
            const lifetimeStats = calculateStats(familyResponses);

            // 2. LIVE TRENDS (Window-based comparison - updates on every prompt)
            // Compare the last 5 prompts vs the 5 prompts before those
            const windowSize = 5;
            const recentSubset = familyResponses.slice(0, windowSize);
            const baselineSubset = familyResponses.slice(windowSize, windowSize * 2);

            const recentStats = calculateStats(recentSubset);
            const baselineStats = calculateStats(baselineSubset);

            const trends = {
                presence: {
                    value: getDelta(recentStats.brandPresence, baselineStats.brandPresence).toFixed(1) + "%",
                    direction: recentStats.brandPresence >= baselineStats.brandPresence ? 'up' : 'down',
                    rawDelta: getDelta(recentStats.brandPresence, baselineStats.brandPresence)
                },
                sentiment: {
                    value: getDelta(recentStats.avgSentiment, baselineStats.avgSentiment).toFixed(1) + "%",
                    direction: recentStats.avgSentiment >= baselineStats.avgSentiment ? 'up' : 'down',
                    rawDelta: getDelta(recentStats.avgSentiment, baselineStats.avgSentiment)
                },
                latency: {
                    value: (recentStats.avgLatency - baselineStats.avgLatency) + "ms",
                    direction: recentStats.avgLatency <= baselineStats.avgLatency ? 'up' : 'down',
                    rawDelta: baselineStats.avgLatency - recentStats.avgLatency
                },
                activity: {
                    value: "+" + (recentStats.totalRuns),
                    direction: 'up',
                    rawDelta: recentStats.totalRuns
                }
            };

            const insights = {
                presence: trends.presence.rawDelta > 5 ? "Visibility is trending upward significantly." :
                    trends.presence.rawDelta < -5 ? "Visibility has dropped vs previous runs." : "Visibility remains stable.",

                sentiment: trends.sentiment.rawDelta > 0 ? "Positive brand sentiment is growing." :
                    trends.sentiment.rawDelta < 0 ? "Sentiment has slightly declined." : "Sentiment remains consistent.",

                latency: trends.latency.rawDelta > 100 ? "Response times have improved notably." :
                    trends.latency.rawDelta < -100 ? "Models are responding slower than usual." : "Latency is stable.",

                activity: trends.activity.rawDelta > 0 ? "Continuous engagement volume detected." : "Activity volume is steady."
            };

            const allSources = Object.entries(lifetimeStats.sources)
                .map(([domain, count]: any) => ({ domain, count }))
                .sort((a: any, b: any) => b.count - a.count);

            const recentActivity = familyResponses.slice(0, 10).map((res: any) => ({
                id: res._id,
                date: res.promptRunId?.createdAt,
                promptText: (res.promptRunId as any)?.promptId?.promptText || "Prompt text unavailable",
                responseText: res.responseText || "No response text available",
                modelName: res.modelName,
                brandsFound: res.identifiedBrands?.map((b: any) => b.brand_name) || []
            }));

            return {
                family,
                metrics: {
                    totalRuns: lifetimeStats.totalRuns,
                    avgLatency: lifetimeStats.avgLatency,
                    avgSentiment: lifetimeStats.avgSentiment,
                    brandPresence: lifetimeStats.brandPresence,
                },
                trends,
                insights,
                topSources: allSources.slice(0, 5),
                allSources,
                sentimentDistribution: lifetimeStats.sentimentDistribution,
                recentActivity
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("Models Analytics Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
