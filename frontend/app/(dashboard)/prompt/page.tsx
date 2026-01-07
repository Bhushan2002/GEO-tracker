"use client";

import { PromptAPI } from "@/api/prompt.api";
import { PromptTable } from "@/components/PromptTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed Sheet imports
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { api } from "@/api/api";
import { Search, Download, Plus, MessageSquare, ListFilter, Play, Globe, User, ShieldCheck, Heart, Info, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types";

import { useDashboardData } from "@/lib/contexts/dashboard-data-context";

export default function Page() {
  const { activeWorkspace } = useWorkspace();
  const { prompts, modelResponses, isLoading, refreshPrompts } = useDashboardData();
  const router = useRouter();

  const [promptText, setPromptText] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);

  useEffect(() => {
    const storedTopics = localStorage.getItem("promptTopics");
    if (storedTopics) {
      try {
        setTopics(JSON.parse(storedTopics));
      } catch (e) {
        console.error("Failed to parse stored topics");
      }
    }
  }, []);

  useEffect(() => {
    if (prompts.length > 0) {
      const derivedTopics = Array.from(
        new Set(prompts.map((p) => p.topic).filter(Boolean))
      ) as string[];

      setTopics((prev) => {
        const merged = Array.from(new Set([...prev, ...derivedTopics]));
        localStorage.setItem("promptTopics", JSON.stringify(merged));
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
    router.push(`/prompt/${prompt._id}`);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "Active") return p.isScheduled;
    if (activeTab === "Inactive") return !p.isScheduled;
    return true;
  });


  return (
    <div className="min-h-screen p-6 space-y-6 max-w-[1600px] mx-auto bg-white">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Prompts</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Build and monitor AI interactions across model networks
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
    </div>
  );
}
