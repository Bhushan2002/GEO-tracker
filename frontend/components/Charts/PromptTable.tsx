"use client";
import React from "react";
import { PromptAPI } from "@/lib/api/prompt.api";
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
import { Plus, Loader, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types";

interface PromptTableProps {
  data: Prompt[];
  loading: boolean;
  onRefresh: () => void;
  onRowClick: (prompt: Prompt) => void;
  onAddClick?: () => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
}

/**
 * Displays a table of prompts with their status, topic, and tags.
 * Allows toggling schedule, adding new prompts, and viewing details.
 */
export function PromptTable({ data, loading, onRefresh, onRowClick, onAddClick, onEdit, onDelete }: PromptTableProps) {
  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await PromptAPI.toggleSchedule(id, !currentStatus);
      toast.success(!currentStatus ? "Prompt Started" : "Prompt Paused");
      onRefresh();
    } catch (error) {
      toast.error("Action failed.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      try {
        // await PromptAPI.delete(promptId);
        toast.success("Prompt deleted successfully");
        onRefresh();
        onDelete?.(promptId);
      } catch (error) {
        toast.error("Failed to delete prompt");
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    onEdit?.(prompt);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground/40">
        <Loader className="h-8 w-8 animate-spin text-foreground shrink-0" strokeWidth={2} />
        <p className="text-sm font-medium">Loading prompts...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <button
          onClick={onAddClick}
          className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
        >
          <Plus className="h-8 w-8 text-slate-300 group-hover:text-slate-900 transition-colors" />
        </button>
        <div>
          <h3 className="text-sm font-bold text-slate-900">No prompts found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Create your first prompt to start monitoring AI brands.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-b border-slate-200">
              <TableHead className="pl-6 py-3 border-r border-slate-100 w-[50%]">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Prompt Description</div>
              </TableHead>
              <TableHead className="w-[12%] border-r border-slate-100 text-center py-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Topic</div>
              </TableHead>
              <TableHead className="w-[12%] border-r border-slate-100 text-center py-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Tags</div>
              </TableHead>
              <TableHead className="w-[12%] border-r border-slate-100 text-center py-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Status</div>
              </TableHead>
              <TableHead className="w-[10%] border-r border-slate-100 text-center py-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Control</div>
              </TableHead>
              <TableHead className="w-[8%] pr-6 text-center py-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((prompt) => (
              <TableRow
                key={prompt._id}
                onClick={() => onRowClick?.(prompt)}
                className="hover:bg-slate-50/30 border-b border-slate-100 last:border-0 transition-all group h-14 cursor-pointer"
              >
                <TableCell className="pl-6 py-4 border-r border-slate-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">
                      {prompt.promptText}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Click to view analytics
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </TableCell>

                <TableCell className="border-r border-slate-100 text-center">
                  {prompt.topic ? (
                    <span className="inline-flex bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-slate-200">
                      {prompt.topic}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-medium italic">General</span>
                  )}
                </TableCell>

                <TableCell className="border-r border-slate-100 text-center">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {(prompt.tags || []).length > 0 ? (
                      (prompt.tags || []).slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{tag}</span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-200 italic">—</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="border-r border-slate-100 text-center">
                  <div className="flex items-center justify-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all border",
                      prompt.isScheduled
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                        : "text-slate-400 bg-slate-50 border-slate-100"
                    )}>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        prompt.isScheduled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"
                      )} />
                      {prompt.isScheduled ? "Active" : "Paused"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="border-r border-slate-100 text-center">
                  <div 
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={prompt.isScheduled}
                            onCheckedChange={() => handleToggle(prompt._id, prompt.isScheduled)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-900 border-none px-3 py-1.5 text-[10px] font-bold text-white rounded-md shadow-lg">
                        {prompt.isScheduled ? "Pause Execution" : "Start Execution"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>

                <TableCell className="pr-6 text-center">
                  <div 
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={(e) => handleEdit(e, prompt)}
                          className="cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          <span className="text-xs font-medium">Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleDelete(e, prompt._id)}
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          <span className="text-xs font-medium">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}