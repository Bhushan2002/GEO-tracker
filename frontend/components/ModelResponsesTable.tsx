"use client";

import { ModelResponseAPI } from "@/api/modelresponse.api";
import { ModelResponse } from "@/types";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "./ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Bot, MessageSquare, Loader, ChevronRight, Globe, Smile, ExternalLink, FileText, CheckCircle2, User, Share2, Download } from "lucide-react";

export function ModelResponsesTable() {
  const [modelRes, setModelRes] = useState<ModelResponse[]>([]);
  const [selectedResponse, setSelectedResponse] =
    useState<ModelResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    ModelResponseAPI.getModelResponses()
      .then((res) => setModelRes(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", "");

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-20 flex flex-col items-center justify-center gap-3 text-foreground/40">
        <Loader className="h-10 w-10 animate-spin text-foreground shrink-0" strokeWidth={1.5} />
        <p className="text-sm font-medium">Fetching model responses...</p>
      </div>
    );
  }

  const filteredResponses = modelRes.filter(r => r.responseText?.trim());

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-auto max-h-[510px] custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <tr className="border-b border-slate-200">
              <th className="w-[180px] font-bold text-[10px] uppercase tracking-widest text-slate-500 py-3 border-r border-slate-100 px-6 text-left">AI Model</th>
              <th className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-3 border-r border-slate-100 px-6 text-left">Preview Response</th>
              <th className="w-[160px] font-bold text-[10px] uppercase tracking-widest text-slate-500 py-3 border-r border-slate-100 text-center">Date & Time</th>
              <th className="w-[80px] py-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredResponses.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-40 text-center text-slate-400 font-medium italic">
                  No generated responses found
                </td>
              </tr>
            ) : (
              filteredResponses.map((response) => (
                <tr
                  key={response._id}
                  onClick={() => {
                    setSelectedResponse(response);
                    setIsDialogOpen(true);
                  }}
                  className="cursor-pointer hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0 h-14 group"
                >
                  <td className="px-6 border-r border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="font-bold text-[13px] text-slate-800">{response.modelName}</span>
                    </div>
                  </td>
                  <td className="max-w-[500px] border-r border-slate-100 px-6">
                    <p className="text-[12px] text-slate-500 line-clamp-1 font-medium italic">
                      {response.responseText}
                    </p>
                  </td>
                  <td className="text-[11px] text-slate-400 font-bold text-center border-r border-slate-100">
                    {formatDate(response.createdAt)}
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent
          className="
            max-w-none sm:max-w-none
            w-[80vw] h-[85vh]
            p-0 bg-white rounded-2xl
            border border-border shadow-2xl
            overflow-hidden flex flex-col
          "
        >
          <AlertDialogTitle className="sr-only">
            Model Response Details
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Detailed view of AI model response including prompt, response text, and identified brands
          </AlertDialogDescription>
          
          {/* Header */}
          <div className="px-10 py-5 border-b border-border flex items-center justify-between bg-white">
            <div className="flex flex-col gap-1">
              <AlertDialogTitle className="text-lg font-bold text-slate-900">AI Model Response Detail</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500 hidden">
                Detailed view of the AI model's response, identified brands, and source citations.
              </AlertDialogDescription>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Succeeded
                </span>

                <span className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full text-[11px] font-bold">
                  <Bot className="h-3.5 w-3.5" />
                  {selectedResponse?.modelName}
                </span>

                <span className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm border",
                  (() => {
                    const avg = selectedResponse?.identifiedBrands?.length
                      ? Math.round(selectedResponse.identifiedBrands.reduce((acc, b) => acc + (b.sentiment_score || 0), 0) / selectedResponse.identifiedBrands.length)
                      : 0;
                    if (avg >= 60) return "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (avg >= 40) return "bg-amber-50 text-amber-700 border-amber-100";
                    return "bg-rose-50 text-rose-700 border-rose-100";
                  })()
                )}>
                  <Smile className="h-3.5 w-3.5" />
                  Avg Sentiment: {(() => {
                    const avgSentiment = selectedResponse?.identifiedBrands?.length
                      ? Math.round(selectedResponse.identifiedBrands.reduce((acc, b) => acc + (b.sentiment_score || 0), 0) / selectedResponse.identifiedBrands.length)
                      : 0;
                    return `${avgSentiment}%`;
                  })()}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* LEFT COLUMN: Chat Timeline */}
            <div className="flex-[2.5] overflow-y-auto bg-white border-r border-border/40">
              <div className="max-w-[850px] mx-auto px-8 py-10 space-y-12">

                {/* USER MESSAGE - Bubble Style */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-slate-50 border border-slate-100 px-6 py-4 shadow-sm">
                    <p className="text-[15px] font-medium text-slate-700 leading-relaxed italic">
                      "{selectedResponse?.promptRunId &&
                        typeof selectedResponse.promptRunId === "object"
                        ? selectedResponse.promptRunId.promptId?.promptText
                        : "Prompt unavailable"}"
                    </p>
                  </div>
                </div>

                {/* AI MESSAGE */}
                <div className="flex gap-5 items-start">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200">
                    <Bot className="h-6 w-6 text-white" />
                  </div>

                  {/* Message */}
                  <div className="flex-1 space-y-6">
                    <div className="prose prose-slate max-w-none">
                      <div className="text-[16px] leading-[1.8] text-slate-800 space-y-6">
                        {(() => {
                          if (!selectedResponse?.responseText) {
                            return (
                              <div className="flex items-center gap-3 text-slate-400 py-4">
                                <Loader className="h-5 w-5 animate-spin" />
                                <span className="text-sm font-medium tracking-tight">Generating premium response…</span>
                              </div>
                            );
                          }

                          const brands = selectedResponse.identifiedBrands || [];

                          const highlightBrands = (text: string) => {
                            if (!brands.length) return text;

                            const regex = new RegExp(
                              `(${brands.map(b =>
                                b.brand_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                              ).join("|")})`,
                              "gi"
                            );

                            return text.split(regex).map((part, i) => {
                              const brand = brands.find(
                                b => b.brand_name.toLowerCase() === part.toLowerCase()
                              );

                              if (!brand) return part;

                              return (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-md border border-dashed border-slate-300 bg-slate-50/50 text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors cursor-default"
                                >
                                  <span className="h-3.5 w-3.5 bg-slate-200 rounded-full inline-flex items-center justify-center overflow-hidden">
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${brand.brand_name.toLowerCase().replace(/\s+/g, '')}.com&sz=32`}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${brand.brand_name}&background=random`;
                                      }}
                                    />
                                  </span>
                                  {part}
                                </span>
                              );
                            });
                          };

                          return (
                            <div className="space-y-6">
                              {selectedResponse.responseText
                                .split("\n\n")
                                .map((p, i) => (
                                  <div key={i} className="last:mb-0">
                                    {highlightBrands(p)}
                                  </div>
                                ))}

                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: Metadata (Independent Scroll) */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 px-6 py-10 space-y-12 min-w-[380px]">

              {/* Brands Section */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    Brands
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {selectedResponse?.identifiedBrands?.length ? (
                    selectedResponse.identifiedBrands.map((brand, idx) => (
                      <div key={idx} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${brand.brand_name.toLowerCase().replace(/\s+/g, '')}.com&sz=64`}
                              alt=""
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${brand.brand_name}&background=random`;
                              }}
                            />
                          </div>
                          <span className="font-semibold text-sm text-slate-700">{brand.brand_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border",
                            (brand.sentiment_score || 0) >= 60
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : (brand.sentiment_score || 0) >= 40
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {(brand.sentiment_score || 0) >= 60 ? "Positive" :
                              (brand.sentiment_score || 0) >= 40 ? "Neutral" : "Negative"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">
                            {brand.sentiment_score || 0}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">No brands detected</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Sources Section */}
              <section>
                <h4 className="text-xs font-bold text-slate-800 mb-6">
                  Sources
                </h4>

                <div className="space-y-4">
                  {(() => {
                    const domains = Array.from(
                      new Map(
                        (selectedResponse?.identifiedBrands ?? [])
                          .flatMap((b) => b.associated_domain ?? [])
                          .filter((d) => d?.domain_citation)
                          .map((d) => [d.domain_citation, d])
                      ).values()
                    );

                    if (domains.length === 0) {
                      return (
                        <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs text-slate-400">No sources detected</p>
                        </div>
                      );
                    }

                    return domains.map((domain: any, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded bg-white border border-slate-100 flex items-center justify-center p-1 shadow-sm">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${domain.domain_citation}&sz=64`}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="font-bold text-[13px] text-slate-800">{domain.domain_citation}</div>
                        </div>

                        <div className="pl-9 space-y-2">
                          {(domain.associated_url ?? []).slice(0, 2).map((urlObj: any, uIdx: number) => (
                            <a
                              key={uIdx}
                              href={urlObj.url_citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group"
                            >
                              <p className="text-[12px] text-slate-500 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {urlObj.url_citation}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </section>

            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
