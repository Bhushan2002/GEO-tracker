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
import { Bot, MessageSquare, Loader, ChevronRight } from "lucide-react";

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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[250px] font-bold text-[11px] uppercase tracking-wider">AI Model</TableHead>
            <TableHead className="font-bold text-[11px] uppercase tracking-wider">Preview Response</TableHead>
            <TableHead className="w-[200px] font-bold text-[11px] uppercase tracking-wider">Date & Time</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResponses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                No model responses found.
              </TableCell>
            </TableRow>
          ) : (
            filteredResponses.map((response) => (
              <TableRow
                key={response._id}
                onClick={() => {
                  setSelectedResponse(response);
                  setIsDialogOpen(true);
                }}
                className="cursor-pointer hover:bg-muted/80 transition-colors group"
              >
                <TableCell className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                    {response.modelName}
                  </div>
                </TableCell>
                <TableCell className="max-w-[500px]">
                  <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">
                    {response.responseText}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {formatDate(response.createdAt)}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors ml-auto" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent
          className="
            max-w-none sm:max-w-none
            w-[98vw] h-[96vh]
            p-0 bg-white rounded-2xl
            border border-border shadow-2xl
            overflow-hidden flex flex-col
          "
        >
          {/* Header */}
          <div className="px-10 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                Succeeded
              </span>
              <div>
                <AlertDialogTitle className="text-sm font-semibold">
                  {selectedResponse?.modelName}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  {selectedResponse && formatDate(selectedResponse.createdAt)}
                </AlertDialogDescription>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="text-2xl text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>

          {/* BODY: Split into two horizontal halves */}
          <div className="flex-1 flex flex-row overflow-hidden min-h-0">

            {/* LEFT COLUMN: Prompt + Response (Independent Scroll) */}
            <div className="flex-[2.2] overflow-y-auto bg-white border-r border-border/50">
              <div className="max-w-[1400px] mx-auto px-16 py-12 space-y-14">
                {/* Prompt Section */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-5 w-1 bg-blue-500 rounded-full" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                      Input Prompt
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-slate-50/50 p-8 shadow-sm">
                    <p className="text-[17px] text-foreground/90 leading-relaxed font-medium italic">
                      “{selectedResponse?.promptRunId &&
                        typeof selectedResponse.promptRunId === "object"
                        ? selectedResponse.promptRunId.promptId?.promptText
                        : "Prompt unavailable"}”
                    </p>
                  </div>
                </section>

                {/* Response Section */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-5 w-1 bg-emerald-500 rounded-full" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                      Model Response
                    </h3>
                  </div>

                  <div className="prose prose-slate max-w-none text-[16px] leading-[1.8] text-foreground/80 space-y-6">
                    {(() => {
                      if (!selectedResponse?.responseText) {
                        return (
                          <div className="flex flex-col items-center py-24 text-muted-foreground">
                            <Bot className="h-12 w-12 mb-4 animate-spin opacity-20" />
                            <p className="text-sm font-medium">Generating response...</p>
                          </div>
                        );
                      }

                      const brands = selectedResponse.identifiedBrands?.map(b => b.brand_name) || [];
                      const highlightBrands = (text: string) => {
                        if (!brands.length) return text;

                        // Create a regex to match any of the brand names (case sensitive or insensitive based on your preference)
                        const regex = new RegExp(`(${brands.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
                        const parts = text.split(regex);

                        const colors = [
                          'bg-blue-100 text-blue-700 border-blue-200',
                          'bg-purple-100 text-purple-700 border-purple-200',
                          'bg-orange-100 text-orange-700 border-orange-200',
                          'bg-emerald-100 text-emerald-700 border-emerald-200',
                          'bg-pink-100 text-pink-700 border-pink-200',
                        ];

                        return parts.map((part, i) => {
                          const isBrand = brands.some(b => b.toLowerCase() === part.toLowerCase());
                          if (isBrand) {
                            const brandIdx = brands.findIndex(b => b.toLowerCase() === part.toLowerCase());
                            const colorClass = colors[brandIdx % colors.length];
                            return (
                              <span
                                key={i}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-md font-bold border mx-0.5 transition-all text-[15px]",
                                  colorClass
                                )}
                              >
                                {part}
                              </span>
                            );
                          }
                          return part;
                        });
                      };

                      return selectedResponse.responseText
                        .split("\n\n")
                        .map((p, i) => (
                          <p key={i} className="first-of-type:text-foreground">
                            {highlightBrands(p)}
                          </p>
                        ));
                    })()}
                  </div>
                </section>
              </div>
            </div>

            {/* RIGHT COLUMN: Metadata (Independent Scroll) */}
            <div className="flex-1 overflow-y-auto bg-slate-50/40 px-8 py-12 space-y-10 min-w-[400px]">

              {/* Brands Section */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Identified Brands
                  </h4>
                  <div className="h-[1px] flex-1 bg-border/40" />
                </div>

                <div className="space-y-3">
                  {selectedResponse?.identifiedBrands?.length ? (
                    selectedResponse.identifiedBrands.map((brand, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border border-border/60 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold text-sm">{brand.brand_name}</span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                            (brand.sentiment_score || 0) >= 60 ? "bg-emerald-50 text-emerald-700" :
                              (brand.sentiment_score || 0) >= 40 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                          )}>
                            {brand.sentiment_score}/100
                          </span>
                        </div>

                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              (brand.sentiment_score || 0) >= 60 ? "bg-emerald-500" :
                                (brand.sentiment_score || 0) >= 40 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${brand.sentiment_score || 0}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                          <span className="capitalize">{brand.sentiment}</span>
                          <span>{brand.mentions} Mentions</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
                      <p className="text-xs text-muted-foreground">No brands detected</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Domain Citations Section */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Domain Citations
                  </h4>
                  <div className="h-[1px] flex-1 bg-border/40" />
                </div>

                <div className="grid grid-cols-1 gap-2">
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
                        <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
                          <p className="text-xs text-muted-foreground">No citations detected</p>
                        </div>
                      );
                    }

                    return domains.map((domain: any, idx) => (
                      <div key={idx} className="bg-white/70 border border-border/40 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-white transition-colors">
                        <div className="font-medium text-[13px]">{domain.domain_citation}</div>
                        <div className="text-[10px] font-bold bg-slate-200/50 px-2 py-0.5 rounded text-muted-foreground">
                          {domain.associated_url?.length || 0} SOURCE
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </section>

              {/* Associated Links Section */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Associated Links
                  </h4>
                  <div className="h-[1px] flex-1 bg-border/40" />
                </div>

                <div className="space-y-2">
                  {(() => {
                    const links = Array.from(
                      new Set(
                        (selectedResponse?.identifiedBrands ?? [])
                          .flatMap((b) =>
                            (b.associated_domain ?? []).flatMap((d) =>
                              (d.associated_url ?? []).map((u) => u.url_citation)
                            )
                          )
                          .filter((u): u is string => !!u)
                      )
                    );

                    if (links.length === 0) {
                      return (
                        <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
                          <p className="text-xs text-muted-foreground">No links detected</p>
                        </div>
                      );
                    }

                    return links.map((url, idx) => {
                      let hostname = url;
                      try { hostname = new URL(url).hostname; } catch { }
                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block bg-white border border-border shadow-sm rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="text-[13px] text-blue-600 font-medium truncate group-hover:underline">{url}</div>
                          <div className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            {hostname}
                          </div>
                        </a>
                      );
                    });
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
