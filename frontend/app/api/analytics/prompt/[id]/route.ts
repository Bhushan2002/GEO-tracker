// import { NextRequest, NextResponse } from "next/server";
// import { connectDatabase } from "@/lib/db/mongodb";
// import { Prompt } from "@/lib/models/prompt.model";
// import { PromptRun } from "@/lib/models/promptRun.model";
// import { ModelResponse } from "@/lib/models/modelResponse.model";
// import { Brand } from "@/lib/models/brand.model";
// import { getWorkspaceId, workspaceError } from "@/lib/workspace-utils";

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';
// export const dynamicParams = true;

// export async function GET(req: NextRequest, props: any) {
//     try {
//         console.log("Analytics Route Hit. Props:", props);

//         // Safe params extraction for Next.js 15/16 (Promise) or 14 (Object)
//         const params = await props.params; // Awaiting a non-promise object is safe in JS
//         console.log("Resolved Params:", params);

//         if (!params?.id) {
//             console.error("Missing ID in params");
//             return NextResponse.json({ message: "No Prompt ID provided" }, { status: 400 });
//         }

//         const promptId = params.id;

//         const workspaceId = await getWorkspaceId(req);
//         if (!workspaceId) return workspaceError();

//         await connectDatabase();

//         const prompt = await Prompt.findOne({ _id: promptId, workspaceId });
//         if (!prompt) return NextResponse.json({ message: "Prompt not found" }, { status: 404 });

//         // Get all runs
//         const allPromptRuns = await PromptRun.find({
//             promptId,
//             workspaceId
//         }).sort({ createdAt: -1 });

//         // Get analytics for last 30 days
//         const startDate = new Date();
//         startDate.setDate(startDate.getDate() - 30);

//         const promptRuns30d = allPromptRuns.filter(pr => pr.createdAt >= startDate);
//         const promptRunIds30d = promptRuns30d.map(pr => pr._id);

//         const modelResponses = await ModelResponse.find({
//             promptRunId: { $in: allPromptRuns.map(pr => pr._id) },
//             workspaceId
//         }).populate({
//             path: 'identifiedBrands',
//             model: Brand
//         });

//         // Group responses by runId for history details
//         const responsesByRun: Record<string, any[]> = {};
//         modelResponses.forEach(res => {
//             const runId = res.promptRunId.toString();
//             if (!responsesByRun[runId]) responsesByRun[runId] = [];
//             responsesByRun[runId].push(res);
//         });

//         // --- Aggregation logic for analytics (last 30 days) ---
//         const brandStats: Record<string, any> = {};
//         const modelResponses30d = modelResponses.filter(res => promptRunIds30d.some(id => id.toString() === res.promptRunId.toString()));

//         modelResponses30d.forEach(res => {
//             (res.identifiedBrands || []).forEach((brand: any) => {
//                 const bName = brand.brand_name;
//                 if (!brandStats[bName]) {
//                     brandStats[bName] = {
//                         brand_name: bName,
//                         mentions: 0,
//                         sentiment_sum: 0,
//                         total_sentiment: 0,
//                         position_sum: 0,
//                         position_count: 0
//                     };
//                 }
//                 brandStats[bName].mentions += 1;
//                 brandStats[bName].sentiment_sum += (brand.sentiment_score || 0);
//                 brandStats[bName].total_sentiment += 1;
//                 if (brand.rank_position) {
//                     brandStats[bName].position_sum += brand.rank_position;
//                     brandStats[bName].position_count += 1;
//                 }
//             });
//         });

//         const totalResponses30d = modelResponses30d.length;
//         const brandData = Object.values(brandStats).map((b: any) => ({
//             _id: b.brand_name,
//             brand_name: b.brand_name,
//             visibility: totalResponses30d > 0 ? Math.round((b.mentions / totalResponses30d) * 100) : 0,
//             sentiment: b.total_sentiment > 0 ? Math.round(b.sentiment_sum / b.total_sentiment) : 0,
//             position: b.position_count > 0 ? (b.position_sum / b.position_count).toFixed(1) : "N/A"
//         })).sort((a, b) => b.visibility - a.visibility);

//         const visibilityMap = new Map();
//         for (let i = 29; i >= 0; i--) {
//             const d = new Date();
//             d.setDate(d.getDate() - i);
//             const dateStr = d.toISOString().split('T')[0];
//             const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
//             visibilityMap.set(dateStr, {
//                 date: displayDate,
//                 totalRuns: 0,
//                 fullDate: dateStr
//             });
//             brandData.slice(0, 5).forEach(b => {
//                 visibilityMap.get(dateStr)[b.brand_name] = 0;
//             });
//         }

//         promptRuns30d.forEach(run => {
//             const dateStr = run.createdAt.toISOString().split('T')[0];
//             if (visibilityMap.has(dateStr)) {
//                 visibilityMap.get(dateStr).totalRuns += 1;
//             }
//         });

//         const topBrandNames = brandData.slice(0, 5).map(b => b.brand_name);
//         modelResponses30d.forEach(res => {
//             const dateStr = (res as any).createdAt?.toISOString().split('T')[0];
//             if (dateStr && visibilityMap.has(dateStr)) {
//                 (res.identifiedBrands || []).forEach((b: any) => {
//                     if (topBrandNames.includes(b.brand_name)) {
//                         visibilityMap.get(dateStr)[b.brand_name] += 1;
//                     }
//                 });
//             }
//         });

//         const visibilityTrend = Array.from(visibilityMap.values()).map(entry => {
//             const result: any = { date: entry.date };
//             const totalPossibleMentions = entry.totalRuns * 5;
//             topBrandNames.forEach(name => {
//                 const mentions = entry[name];
//                 result[name] = totalPossibleMentions > 0 ? Math.round((mentions / totalPossibleMentions) * 100) : 0;
//             });
//             return result;
//         });

//         const sourceMap: Record<string, any> = {};
//         const typeMap: Record<string, number> = {};
//         modelResponses30d.forEach(res => {
//             (res.identifiedBrands || []).forEach((b: any) => {
//                 (b.associated_domain || []).forEach((domain: any) => {
//                     const dName = domain.domain_citation || "unknown";
//                     if (!sourceMap[dName]) {
//                         sourceMap[dName] = { domain: dName, citations: 0, type: domain.domain_citation_type || "Other" };
//                     }
//                     sourceMap[dName].citations += 1;
//                     const tName = domain.domain_citation_type || "Other";
//                     typeMap[tName] = (typeMap[tName] || 0) + 1;
//                 });
//             });
//         });

//         const totalCitations = Object.values(sourceMap).reduce((acc: number, s: any) => acc + s.citations, 0);
//         const sourcesList = Object.values(sourceMap).map((s: any) => ({
//             domain: s.domain,
//             citations: s.citations,
//             used: totalCitations > 0 ? Math.round((s.citations / totalCitations) * 100) : 0,
//             avgCitations: (s.citations / (modelResponses30d.length || 1)).toFixed(1),
//             type: s.type
//         })).sort((a, b) => b.citations - a.citations).slice(0, 10);

//         const sourceTypes = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

//         return NextResponse.json({
//             promptText: prompt.promptText,
//             tags: prompt.tags || [],
//             visibilityTrend,
//             brands: brandData,
//             sources: sourcesList,
//             sourceTypes,
//             executionHistory: allPromptRuns.map(run => {
//                 const responses = responsesByRun[run._id.toString()] || [];
//                 const distinctBrands = new Set<string>();
//                 let totalSnt = 0;
//                 let sntCount = 0;
//                 let totalLatency = 0;

//                 responses.forEach(r => {
//                     (r.identifiedBrands || []).forEach((b: any) => {
//                         distinctBrands.add(b.brand_name);
//                         if (typeof b.sentiment_score === 'number') {
//                             totalSnt += b.sentiment_score;
//                             sntCount += 1;
//                         }
//                     });
//                     totalLatency += r.latencyMs || 0;
//                 });

//                 return {
//                     id: run._id,
//                     date: run.createdAt,
//                     status: run.status,
//                     brandsDetectedCount: distinctBrands.size,
//                     brandsDetected: Array.from(distinctBrands), // Return all brand names
//                     avgSentiment: sntCount > 0 ? Math.round(totalSnt / sntCount) : 0,
//                     avgLatency: responses.length > 0 ? Math.round(totalLatency / responses.length) : 0,
//                     modelsCount: responses.length
//                 };
//             }),
//             metadata: {
//                 createdAt: prompt.createdAt,
//                 totalMentions: brandData.reduce((acc: number, b: any) => acc + b.visibility, 0),
//                 totalSources: sourcesList.length,
//                 avgSentiment: brandData.length > 0 ? Math.round(brandData.reduce((acc: number, b: any) => acc + b.sentiment, 0) / brandData.length) : 0
//             }
//         }, { status: 200 });

//     } catch (error) {
//         console.error("Error fetching prompt analytics:", error);
//         return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
//     }
// }
