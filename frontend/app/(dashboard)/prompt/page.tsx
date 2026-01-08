"use client";

import { PromptAPI } from "@/lib/api/prompt.api";
import { PromptTable } from "@/components/Charts/PromptTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed Sheet imports
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import React, { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { api } from "@/lib/api/api";
import {
  Search,
  Download,
  Plus,
  MessageSquare,
  ListFilter,
  Play,
  Globe,
  User,
  ShieldCheck,
  Heart,
  Info,
  Clock,
  ExternalLink,
  ChevronDown,
  Tag as TagIcon
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import PromptDetailsPage from "./[id]/page";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function PromptContent() {
  const { activeWorkspace } = useWorkspace();
  const { prompts, modelResponses, isLoading, refreshPrompts } = useDashboardData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPromptId = searchParams.get("id");




  const [promptText, setPromptText] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);

  useEffect(() => {
    const storedTopics = localStorage.getItem("promptTopics");
    const storedTags = localStorage.getItem("promptTags");
    if (storedTopics) {
      try {
        setTopics(JSON.parse(storedTopics));
      } catch (e) {
        console.error("Failed to parse stored topics");
      }
    }
    if (storedTags) {
      try {
        setAvailableTags(JSON.parse(storedTags));
      } catch (e) {
        console.error("Failed to parse stored tags");
      }
    }
  }, []);

  useEffect(() => {
    if (prompts.length > 0) {
      const derivedTopics = Array.from(
        new Set(prompts.map((p) => p.topic).filter(Boolean))
      ) as string[];

      const allTags = prompts.reduce((acc: string[], p) => {
        return [...acc, ...(p.tags || [])];
      }, []);
      const derivedTags = Array.from(new Set(allTags)).filter(Boolean);

      setTopics((prev) => {
        const merged = Array.from(new Set([...prev, ...derivedTopics]));
        localStorage.setItem("promptTopics", JSON.stringify(merged));
        return merged;
      });

      setAvailableTags((prev) => {
        const merged = Array.from(new Set([...prev, ...derivedTags]));
        localStorage.setItem("promptTags", JSON.stringify(merged));
        return merged;
      });
    }
  }, [prompts]);

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return toast.error("Prompt text is required.");
    if (!topic.trim()) return toast.error("Topic is required.");

    try {
      const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
      await PromptAPI.create({
        promptText,
        topic: topic.trim(),
        tags: tags.length ? tags : undefined,
      });

      toast.success("Prompt added successfully!");
      refreshPrompts();

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


  const handleRowClick = (prompt: Prompt) => {
    router.push(`/prompt?id=${prompt._id}`);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "Active") return p.isScheduled;
    if (activeTab === "Inactive") return !p.isScheduled;
    return true;
  });


  if (selectedPromptId) {
    return <PromptDetailsPage manualId={selectedPromptId} />;
  }

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-[1600px] mx-auto bg-white animate-in fade-in duration-500 ease-out">
      {/* 1. Header Section */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] -mx-6 -mt-6 mb-8">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">AI Prompts</h1>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                Build, test, and schedule prompts to monitor how AI models perceive and rank your brand.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExecuteAll}
              disabled={isExecuting}
              variant="outline"
              size="sm"
              className="h-10 px-4 text-[13px] font-bold border-slate-200 hover:bg-slate-50 rounded-xl shadow-none transition-all"
            >
              {isExecuting ? "Executing..." : "Run All Prompts"}
            </Button>
            <Button
              onClick={() => setIsAddPromptOpen(true)}
              size="sm"
              className="h-10 px-5 text-[13px] font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Prompt
            </Button>
          </div>
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

        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl text-[13px] font-medium w-full sm:w-[320px] focus:bg-white focus:border-slate-200 focus:ring-0 transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>
      </div>

      <PromptTable
        data={filteredPrompts}
        loading={isLoading}
        onRefresh={refreshPrompts}
        onRowClick={handleRowClick}
        onAddClick={() => setIsAddPromptOpen(true)}
      />

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
                  <SelectContent className="rounded-lg shadow-md border-slate-100 p-0">
                    <div className="p-1.5 sticky top-0 bg-white z-10 border-b border-slate-50">
                      <Input
                        placeholder="Add new..."
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                        className="h-8 text-xs rounded-md border-slate-100"
                      />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto p-1">
                      {topics.map(t => (
                        <SelectItem key={t} value={t} className="text-xs rounded-md cursor-pointer">
                          {t}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Tags</label>
                <div className="relative group">
                  <Input
                    placeholder="e.g. tech, medical"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    className="h-10 rounded-lg border-slate-200 text-sm pr-10"
                  />
                  {availableTags.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden" align="end">
                        <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex flex-col gap-2 sticky top-0 bg-white z-10">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 ml-1">
                            <TagIcon className="h-3 w-3" />
                            Select Tags
                          </span>
                          <Input
                            placeholder="Search tags..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="h-8 text-[11px] rounded-md border-slate-100"
                          />
                        </div>
                        <div className="max-h-[220px] overflow-y-auto p-1.5 space-y-0.5">
                          {availableTags
                            .filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
                            .map((tag) => {
                              const isSelected = tagsText.split(',').map(t => t.trim().toLowerCase()).includes(tag.toLowerCase());
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                                    if (isSelected) {
                                      setTagsText(tags.filter(t => t.toLowerCase() !== tag.toLowerCase()).join(', '));
                                    } else {
                                      setTagsText([...tags, tag].join(', '));
                                    }
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer",
                                    isSelected
                                      ? "bg-slate-900 text-white"
                                      : "text-slate-600 hover:bg-slate-100"
                                  )}
                                >
                                  <span>#{tag}</span>
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                                </button>
                              );
                            })}
                          {availableTags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                            <div className="p-4 text-center text-[11px] text-slate-400 italic">No tags found</div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
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
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center min-h-screen">Loading...</div>}>
      <PromptContent />
    </Suspense>
  );
}
