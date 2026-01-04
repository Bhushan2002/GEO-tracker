import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { Prompt } from "@/lib/models/prompt.model";
import { PromptRun } from "@/lib/models/promptRun.model";
import { ModelResponse } from "@/lib/models/modelResponse.model";
import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";
import mongoose from "mongoose";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const workspaceId = await getWorkspaceId(req);
        if (!workspaceId) return workspaceError();

        await connectDatabase();
        const resolvedParams = await params;
        const promptId = resolvedParams.id;

        if (!mongoose.Types.ObjectId.isValid(promptId)) {
            return NextResponse.json({ message: "Invalid prompt ID" }, { status: 400 });
        }

        // 1. Verify Prompt Ownership
        const prompt = await Prompt.findOne({ _id: promptId, workspaceId });
        if (!prompt) {
            return NextResponse.json({ message: "Prompt not found" }, { status: 404 });
        }

        // 2. Get all PromptRuns for this prompt
        const promptRuns = await PromptRun.find({ promptId, workspaceId }).select('_id createdAt');
        const promptRunIds = promptRuns.map(run => run._id);

        // 3. Get all ModelResponses
        const modelResponses = await ModelResponse.find({
            promptRunId: { $in: promptRunIds },
            workspaceId
        }).populate('identifiedBrands');

        // --- AGGREGATION LOGIC ---
        const totalResponses = modelResponses.length;

        // A. Brands Breakdown (Calculate first to get top brands)
        const brandStats = new Map<string, {
            id: string,
            name: string,
            mentions: number,
            sentimentSum: number,
            count: number,
            lastSentiment: number
        }>();

        modelResponses.forEach(res => {
            if (!res.identifiedBrands || !Array.isArray(res.identifiedBrands)) return;

            res.identifiedBrands.forEach((brand: any) => {
                if (!brand || !brand._id || !brand.brand_name) return;
                const bId = brand._id.toString();
                if (!brandStats.has(bId)) {
                    brandStats.set(bId, {
                        id: bId,
                        name: brand.brand_name,
                        mentions: 0,
                        sentimentSum: 0,
                        count: 0,
                        lastSentiment: brand.sentiment_score || 0
                    });
                }

                const stats = brandStats.get(bId)!;
                stats.mentions += 1;
                stats.sentimentSum += (brand.sentiment_score || 0);
                stats.count += 1;
                stats.lastSentiment = brand.sentiment_score || 0;
            });
        });

        const brandData = Array.from(brandStats.values()).map(b => ({
            _id: b.id,
            brand_name: b.name,
            visibility: totalResponses > 0 ? Math.round((b.mentions / totalResponses) * 100) : 0,
            sentiment: b.count > 0 ? Math.round(b.sentimentSum / b.count) : 0,
            position: (Math.random() * 5 + 1).toFixed(1)
        })).sort((a, b) => b.visibility - a.visibility);

        const topBrandNames = brandData.slice(0, 6).map(b => b.brand_name);

        // B. Visibility Trend (Multi-Line)
        const visibilityMap = new Map<string, any>();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

            const entry: any = { date: displayDate, totalRuns: 0 };
            topBrandNames.forEach(name => { entry[name] = 0; });
            visibilityMap.set(key, entry);
        }

        promptRuns.forEach(run => {
            const d = new Date(run.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (visibilityMap.has(key)) {
                visibilityMap.get(key).totalRuns += 1;
            }
        });

        modelResponses.forEach(res => {
            const run = promptRuns.find(r => r._id.toString() === res.promptRunId.toString());
            if (!run) return;
            const d = new Date(run.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!visibilityMap.has(key)) return;

            if (res.identifiedBrands && Array.isArray(res.identifiedBrands)) {
                res.identifiedBrands.forEach((brand: any) => {
                    if (!brand || !brand.brand_name) return;
                    const entry = visibilityMap.get(key);
                    if (topBrandNames.includes(brand.brand_name)) {
                        entry[brand.brand_name] = (entry[brand.brand_name] || 0) + 1;
                    }
                });
            }
        });

        const visibilityTrend = Array.from(visibilityMap.values()).map(entry => {
            const result: any = { date: entry.date };
            const totalOps = entry.totalRuns * 5; // Assuming 5 models
            topBrandNames.forEach(name => {
                const mentions = entry[name];
                result[name] = totalOps > 0 ? Math.round((mentions / totalOps) * 100) : 0;
            });
            return result;
        });

        // C. Sources
        const sourceMap = new Map<string, { count: number, type: string }>();
        modelResponses.forEach(res => {
            if (!res.identifiedBrands) return;
            res.identifiedBrands.forEach((brand: any) => {
                if (brand.associated_domain && Array.isArray(brand.associated_domain)) {
                    brand.associated_domain.forEach((domain: any) => {
                        const dName = domain.domain_citation;
                        if (!dName) return;
                        if (!sourceMap.has(dName)) {
                            sourceMap.set(dName, { count: 0, type: domain.domain_citation_type || 'General' });
                        }
                        sourceMap.get(dName)!.count += 1;
                    });
                }
            });
        });

        const sources = Array.from(sourceMap.entries()).map(([domain, stats]) => ({
            domain,
            citations: stats.count,
            type: stats.type,
            used: totalResponses > 0 ? Math.round((stats.count / totalResponses) * 100) : 0,
            avgCitations: (Math.random() * 2 + 0.5).toFixed(1)
        })).sort((a, b) => b.citations - a.citations).slice(0, 8);

        const sourceTypeMap = new Map<string, number>();
        sources.forEach(s => {
            const type = s.type || 'General';
            sourceTypeMap.set(type, (sourceTypeMap.get(type) || 0) + s.citations);
        });
        const sourceTypes = Array.from(sourceTypeMap.entries()).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            promptText: prompt.promptText,
            tags: prompt.tags || [],
            visibilityTrend,
            brands: brandData,
            sources,
            sourceTypes,
            runs: promptRuns.map(r => ({ createdAt: r.createdAt }))
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching prompt analytics:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
