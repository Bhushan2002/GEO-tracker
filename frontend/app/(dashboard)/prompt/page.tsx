"use client";

import { PromptAPI } from "@/api/prompt.api";
import { PromptTable } from "@/components/PromptTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [promptText, setPromptText] = useState("");
  const [topic, setTopic] = useState("");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true); // Ensure loading state is active on refresh
    try {
      const res = await PromptAPI.getAll(); // Match updated API naming
      setPrompts(res.data);
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

    try {
      const res = await PromptAPI.create({
        promptText,
        topic: topic.trim() || undefined,
      });

      toast.success("Prompt added successfully!");

      // Update state locally with the new prompt (including its isScheduled status)
      setPrompts((prev) => [res.data, ...prev]);

      // Clear inputs
      setPromptText("");
      setTopic("");
    } catch (error) {
      toast.error("Failed to add prompt. Please try again.");
    }
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
          <Input
            placeholder="Enter prompt text "
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
          <Input
            placeholder="Topic (Optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
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
            {isExecuting ? "Executing..." : "▶ Execute All Scheduled Prompts"}
          </Button>
        </div>
        {/* Pass the refresh function to the table so buttons can trigger a reload */}
        <PromptTable data={prompts} loading={isLoading} onRefresh={loadPrompts} />
      </div>
    </div>
  );
}