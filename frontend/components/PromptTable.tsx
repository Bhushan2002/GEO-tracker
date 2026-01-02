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
import { MoreHorizontal, Play, Pause, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types";

interface PromptTableProps {
  data: Prompt[];
  loading: boolean;
  onRefresh: () => void;
  onRowClick: (prompt: Prompt) => void;
}

export function PromptTable({ data, loading, onRefresh, onRowClick }: PromptTableProps) {
  const handleToggle = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation(); // Avoid triggering row click
    try {
      await PromptAPI.toggleSchedule(id, !currentStatus);
      toast.success(!currentStatus ? "Prompt Started" : "Prompt Paused");
      onRefresh();
    } catch (error) {
      toast.error("Action failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <div className="h-8 w-8 border-2 border-slate-200 border-t-slate-800 animate-spin rounded-full" />
        <p className="text-sm font-medium">Loading prompts...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
          <Plus className="h-8 w-8 text-slate-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">No prompts found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Create your first prompt to start monitoring AI brands.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="pl-6 py-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Prompt</div>
              </TableHead>
              <TableHead className="w-[140px]">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Topic</div>
              </TableHead>
              <TableHead className="w-[180px]">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tags</div>
              </TableHead>
              <TableHead className="w-[120px] text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</div>
              </TableHead>
              <TableHead className="w-[100px] pr-6 text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((prompt) => (
              <TableRow
                key={prompt._id}
                className="hover:bg-slate-50 border-slate-100 transition-colors"
              >
                <TableCell className="pl-6 py-5">
                  <span className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 max-w-[600px]">
                    {prompt.promptText}
                  </span>
                </TableCell>

                <TableCell>
                  {prompt.topic ? (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight">
                      {prompt.topic}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 italic">Uncategorized</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {(prompt.tags || []).length > 0 ? (
                      (prompt.tags || []).map((tag, i) => (
                        <span key={i} className="text-[10px] text-slate-400 font-medium">#{tag}</span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-300 italic">—</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                      prompt.isScheduled
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-slate-400 bg-slate-50"
                    )}>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        prompt.isScheduled ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                      {prompt.isScheduled ? "Active" : "Paused"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="pr-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md hover:bg-white hover:border-slate-200 border border-slate-100 shadow-sm cursor-pointer"
                          onClick={(e) => handleToggle(e, prompt._id, prompt.isScheduled)}
                        >
                          {prompt.isScheduled ? (
                            <Pause className="h-3.5 w-3.5 text-slate-600" />
                          ) : (
                            <Play className="h-3.5 w-3.5 text-slate-600" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-900 px-3 py-1.5 text-[10px] font-bold">
                        {prompt.isScheduled ? "Pause " : "Schedule Prompt"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md hover:bg-white hover:border-slate-200 border border-slate-100 shadow-sm cursor-pointer"
                          onClick={() => onRowClick(prompt)}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-900 px-3 py-1.5 text-[10px] font-bold">
                        View Analytics
                      </TooltipContent>
                    </Tooltip>
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