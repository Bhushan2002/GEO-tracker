"use client";

import { PromptAPI } from "@/api/prompt.api";
import { ModelResponseAPI } from "@/api/modelresponse.api";
import { PromptTable } from "@/components/PromptTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { api } from "@/api/api";
import { Search, Download, Plus, MessageSquare, ListFilter, Play, Globe, User, ShieldCheck, Heart, Info, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prompt, ModelResponse } from "@/types";

export default function Page() {
  const { activeWorkspace } = useWorkspace();
  const [promptText, setPromptText] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedPromptResponses, setSelectedPromptResponses] = useState<ModelResponse[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    const storedTopics = localStorage.getItem("promptTopics");
    if (storedTopics) {
      try {
        setTopics(JSON.parse(storedTopics));
      } catch (e) {
        console.error("Failed to parse stored topics");
      }
    }
    loadPrompts();
  }, [activeWorkspace?._id]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const res = await PromptAPI.getAll();
      setPrompts(res.data);
      const derivedTopics = Array.from(
        new Set((res.data || []).map((p: any) => p.topic).filter(Boolean))
      ) as string[];

      setTopics((prev) => {
        const merged = Array.from(new Set([...prev, ...derivedTopics]));
        localStorage.setItem("promptTopics", JSON.stringify(merged));
        return merged;
      });
    } catch (error) {
      toast.error("Failed to load prompts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return toast.error("Prompt text is required.");
    if (!topic.trim()) return toast.error("Topic is required.");

    try {
      const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await PromptAPI.create({
        promptText,
        topic: topic.trim(),
        tags: tags.length ? tags : undefined,
      });

      toast.success("Prompt added successfully!");
      setPrompts((prev) => [res.data, ...prev]);
      if (topic && !topics.includes(topic)) {
        setTopics((prev) => {
          const updated = [topic, ...prev];
          localStorage.setItem("promptTopics", JSON.stringify(updated));
          return updated;
        });
      }
      setPromptText("");
      setTagsText("");
      setIsAddPromptOpen(false);
    } catch (error) {
      toast.error("Failed to add prompt.");
    }
  };

  const handleAddTopic = () => {
    const value = newTopic.trim();
    if (!value || topics.includes(value)) return;
    setTopics((prev) => {
      const updated = [value, ...prev];
      localStorage.setItem("promptTopics", JSON.stringify(updated));
      return updated;
    });
    setTopic(value);
    setNewTopic("");
    toast.success("Topic added.");
  };

  const handleExecuteAll = async () => {
    setIsExecuting(true);
    try {
      const response = await api.post('/api/prompt/execute-all');
      toast.success(response.data.message || "Prompts execution started!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to execute prompts");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRowClick = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsDetailLoading(true);
    try {
      const res = await ModelResponseAPI.getModelResponses();
      // Filter responses for this specific prompt
      const filtered = res.data.filter(r => {
        const pid = typeof r.promptRunId === 'object' ? r.promptRunId.promptId?._id : null;
        return pid === prompt._id;
      });
      setSelectedPromptResponses(filtered);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch detailed data.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "Active") return p.isScheduled;
    if (activeTab === "Inactive") return !p.isScheduled;
    return true;
  });

  // Stats calculation
  const stats = React.useMemo(() => {
    if (!selectedPromptResponses.length) return { visibility: 0, sentiment: 0, brands: [] };

    let totalBrands = 0;
    let totalSentiment = 0;
    const brandMap = new Map();

    selectedPromptResponses.forEach(r => {
      (r.identifiedBrands || []).forEach(b => {
        totalBrands++;
        totalSentiment += b.sentiment_score || 0;
        brandMap.set(b.brand_name, (brandMap.get(b.brand_name) || 0) + 1);
      });
    });

    return {
      visibility: Math.min(100, Math.round((brandMap.size / 10) * 100)), // Capped at 100%
      sentiment: Math.round(totalSentiment / (totalBrands || 1)),
      brands: Array.from(brandMap.entries()).map(([name, count]) => ({ name, count }))
    };
  }, [selectedPromptResponses]);

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-[1600px] mx-auto bg-white">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prompts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and monitor AI model performance across workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExecuteAll}
            disabled={isExecuting}
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            {isExecuting ? "Executing..." : "Run All Prompts"}
          </Button>
          <Button
            onClick={() => setIsAddPromptOpen(true)}
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-none cursor-pointer"
          >
            Add Prompt
          </Button>
        </div>
      </div>

      {/* Navigation & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 border-b border-transparent">
          {["All", "Active", "Inactive"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative cursor-pointer",
                activeTab === tab
                  ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-full sm:w-[280px] focus:ring-1 focus:ring-slate-200 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Table Area */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <PromptTable data={filteredPrompts} loading={isLoading} onRefresh={loadPrompts} onRowClick={handleRowClick} />
      </div>

      {/* Add Prompt Dialog */}
      <AlertDialog open={isAddPromptOpen} onOpenChange={setIsAddPromptOpen}>
        <AlertDialogContent className="max-w-lg bg-white rounded-xl p-0 overflow-hidden border border-slate-200 shadow-lg">
          <div className="px-6 py-4 border-b border-slate-100">
            <AlertDialogTitle className="text-lg font-bold text-slate-900">New Prompt</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 mt-0.5">
              Configure a new prompt to track AI sentiment.
            </AlertDialogDescription>
          </div>

          <form onSubmit={handleAddPrompt} className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Prompt Text</label>
              <textarea
                placeholder="Enter prompt criteria..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Topic</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-md border-slate-100">
                    <div className="p-1.5 pt-0">
                      <Input
                        placeholder="Add new..."
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                        className="h-8 text-xs rounded-md border-slate-100 mb-1"
                      />
                    </div>
                    {topics.map(t => (
                      <SelectItem key={t} value={t} className="text-xs rounded-md">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Tags (CSV)</label>
                <Input
                  placeholder="e.g. tech, medical"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <AlertDialogCancel className="h-10 px-4 rounded-lg border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <Button type="submit" className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-all shadow-none cursor-pointer">
                Save Prompt
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Sheet */}
      <Sheet open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] bg-white p-0 border-l border-slate-200 shadow-xl flex flex-col"
        >
          <div className="px-8 py-6 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Report</span>
            <SheetTitle className="text-xl font-bold text-slate-900">Analysis Overview</SheetTitle>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12">
            {/* Context Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Context</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="text-sm text-slate-800 font-medium leading-relaxed italic">
                  “{selectedPrompt?.promptText}”
                </p>
              </div>
            </section>

            {/* Metrics Section */}
            <section className="grid grid-cols-2 gap-8 border-y border-slate-100 py-10">
              <div className="space-y-1">
                <span className="text-3xl font-bold text-slate-900">{stats.visibility}%</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibility</p>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-bold text-slate-900">{stats.sentiment}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Sentiment</p>
              </div>
            </section>

            {/* Entities Section */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identified Brands</h3>
              {stats.brands.length ? (
                <div className="space-y-3">
                  {stats.brands.map((b, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden transition-all">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${b.name.toLowerCase().replace(/\s+/g, '')}.com&sz=128`}
                            alt={b.name}
                            className="h-4 w-4 object-contain"
                            onError={(e) => {
                              (e.target as any).src = `https://ui-avatars.com/api/?name=${b.name}&background=f1f5f9&color=64748b`;
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{b.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{b.count} mentions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No assets detected.</p>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}