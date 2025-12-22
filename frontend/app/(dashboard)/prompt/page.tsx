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
        <h2 className="text-xl font-bold mb-4">Active Monitoring Prompts</h2>
        {/* Pass the refresh function to the table so buttons can trigger a reload */}
        <PromptTable data={prompts} loading={isLoading} onRefresh={loadPrompts} />
      </div>
    </div>
  );
}