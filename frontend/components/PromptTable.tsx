"use client";
import { PromptAPI } from "@/api/prompt.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface Prompt {
  _id: string;
  promptText: string;
  topic?: string;
  tags: string[];
  isScheduled: boolean; 
  createdAt: string;
}
interface PromptTableProps {
  data: Prompt[];
  loading: boolean;
  onRefresh: () => void;
}

export function PromptTable({ data, loading, onRefresh }: PromptTableProps) {
  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      // Logic for toggleSchedule should be added to PromptAPI
      await PromptAPI.toggleSchedule(id, !currentStatus);
      toast.success(!currentStatus ? "Scheduled" : "Paused");
      onRefresh(); // Trigger parent refresh
    } catch (error) {
      toast.error("Action failed.");
    }
  };

  if (loading) return <div className="p-4">Loading prompts...</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prompt Text</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((prompt) => (
            <TableRow key={prompt._id}>
              <TableCell className="font-medium max-w-[500px] whitespace-normal">
                {prompt.promptText}
              </TableCell>
              <TableCell>
                {prompt.topic ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    {prompt.topic}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px]">
                {prompt.tags && prompt.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${prompt.isScheduled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {prompt.isScheduled ? "Scheduled" : "Paused"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {prompt.isScheduled ? (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleToggle(prompt._id, true)}
                  >
                    Stop Schedule
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => handleToggle(prompt._id, false)}
                  >
                    Run on Schedule
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}