"use client";

import { PromptAPI } from "@/api/prompt.api";
import { PromptTable } from "@/components/PromptTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [promptText, setPromptText] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Load topics from localStorage on mount
    const storedTopics = localStorage.getItem("promptTopics");
    if (storedTopics) {
      try {
        setTopics(JSON.parse(storedTopics));
      } catch (e) {
        console.error("Failed to parse stored topics");
      }
    }
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true); // Ensure loading state is active on refresh
    try {
      const res = await PromptAPI.getAll(); // Match updated API naming
      setPrompts(res.data);
      // Derive unique topics from existing prompts
      const derivedTopics = Array.from(
        new Set((res.data || []).map((p: any) => p.topic).filter(Boolean))
      ) as string[];
      
      // Merge with stored topics (avoid duplicates)
      setTopics((prev) => {
        const merged = Array.from(new Set([...prev, ...derivedTopics]));
        // Save to localStorage
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

    if (!promptText.trim()) {
      return toast.error("Prompt text is required.");
    }
    if (!topic.trim()) {
      return toast.error("Topic is required.");
    }

    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await PromptAPI.create({
        promptText,
        topic: topic.trim(),
        tags: tags.length ? tags : undefined,
      });

      toast.success("Prompt added successfully!");

      // Update state locally with the new prompt (including its isScheduled status)
      setPrompts((prev) => [res.data, ...prev]);
      // Ensure topics list includes the selected topic
      if (topic && !topics.includes(topic)) {
        setTopics((prev) => {
          const updated = [topic, ...prev];
          localStorage.setItem("promptTopics", JSON.stringify(updated));
          return updated;
        });
      }

      // Clear inputs
      setPromptText("");
      setTagsText("");
    } catch (error) {
      toast.error("Failed to add prompt. Please try again.");
    }
  };

  const handleAddTopic = () => {
    const value = newTopic.trim();
    if (!value) {
      toast.error("Please enter a topic name to add.");
      return;
    }
    if (topics.includes(value)) {
      toast.error("Topic already exists in the list.");
      return;
    }
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
      const response = await fetch('/api/prompt/execute-all', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || "Prompts execution started!");
      } else {
        toast.error(data.message || "Failed to execute prompts");
      }
    } catch (error) {
      toast.error("Failed to execute prompts");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card shadow-sm">
        <h2 className="text-xl font-bold">Create New Prompt</h2>
        <form onSubmit={handleAddPrompt} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Prompt Text</label>
            <Input
              placeholder="Enter prompt text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Topic (Required)</label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                <div className="flex items-center gap-2 p-2 border-b">
                  <Input
                    placeholder="Add new topic"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    className="h-8"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleAddTopic}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                {topics.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    No topics available
                  </SelectItem>
                )}
                {topics.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <Input
              placeholder="e.g. monitoring, alerts, ai"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-fit">
            Save Prompt
          </Button>
        </form>
      </div>

      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Active Monitoring Prompts</h2>
          <Button 
            onClick={handleExecuteAll}
            disabled={isExecuting}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            {isExecuting ? "Executing..." : "Execute All Scheduled Prompts"}
          </Button>
        </div>
        <PromptTable data={prompts} loading={isLoading} onRefresh={loadPrompts} />
      </div>
    </div>
  );
}