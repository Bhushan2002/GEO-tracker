"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Plus, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types";

interface EditPromptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingPrompt: Prompt | null;
    editTagsText: string;
    setEditTagsText: (tags: string) => void;
    availableTags: string[];
    setAvailableTags: React.Dispatch<React.SetStateAction<string[]>>;
    editTagSearch: string;
    setEditTagSearch: (search: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function EditPromptDialog({
    isOpen,
    onOpenChange,
    editingPrompt,
    editTagsText,
    setEditTagsText,
    availableTags,
    setAvailableTags,
    editTagSearch,
    setEditTagSearch,
    onSubmit,
}: EditPromptDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg bg-white rounded-xl p-0 overflow-hidden border border-slate-200 shadow-lg">
                <div className="px-6 py-4 border-b border-slate-100">
                    <AlertDialogTitle className="text-lg font-bold text-slate-900">
                        Edit Prompt
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-slate-500 mt-0.5">
                        Update tags for this prompt.
                    </AlertDialogDescription>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="p-6 space-y-5 bg-white"
                >
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">
                            Prompt Text
                        </label>
                        <div className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                            {editingPrompt?.promptText}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">
                                Topic
                            </label>
                            <div className="h-10 px-3 flex items-center text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                                {editingPrompt?.topic || "No topic"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">
                                Tags
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="h-10 w-full px-3 flex items-center justify-between text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <span className="text-slate-500 truncate">
                                            {editTagsText.trim() || "Select tags"}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0 rounded-lg shadow-md border-slate-100">
                                    <div className="p-2 border-b border-slate-50">
                                        <div className="relative">
                                            <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                placeholder="Search or add new tag..."
                                                value={editTagSearch}
                                                onChange={(e) => setEditTagSearch(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && editTagSearch.trim()) {
                                                        e.preventDefault();
                                                        const newTag = editTagSearch.trim();
                                                        const tags = editTagsText
                                                            .split(",")
                                                            .map((t) => t.trim())
                                                            .filter(Boolean);
                                                        if (!tags.some((t) => t.toLowerCase() === newTag.toLowerCase())) {
                                                            setEditTagsText([...tags, newTag].join(", "));
                                                            if (!availableTags.includes(newTag)) {
                                                                setAvailableTags((prev) => {
                                                                    const updated = [...prev, newTag];
                                                                    localStorage.setItem("promptTags", JSON.stringify(updated));
                                                                    return updated;
                                                                });
                                                            }
                                                        }
                                                        setEditTagSearch("");
                                                    }
                                                }}
                                                className="h-8 text-xs rounded-md border-slate-100 pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto p-1">
                                        {availableTags
                                            .filter((tag) =>
                                                tag.toLowerCase().includes(editTagSearch.toLowerCase())
                                            )
                                            .map((tag) => {
                                                const isSelected = editTagsText
                                                    .split(",")
                                                    .map((t) => t.trim().toLowerCase())
                                                    .includes(tag.toLowerCase());
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            const tags = editTagsText
                                                                .split(",")
                                                                .map((t) => t.trim())
                                                                .filter(Boolean);
                                                            if (isSelected) {
                                                                setEditTagsText(
                                                                    tags
                                                                        .filter((t) => t.toLowerCase() !== tag.toLowerCase())
                                                                        .join(", ")
                                                                );
                                                            } else {
                                                                setEditTagsText([...tags, tag].join(", "));
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-2 py-1.5 my-2 text-xs rounded-md transition-colors flex items-center justify-between",
                                                            isSelected
                                                                ? "bg-slate-200 "
                                                                : "hover:bg-slate-100 "
                                                        )}
                                                    >
                                                        <span>#{tag}</span>
                                                        {isSelected && <span className="text-xs">✓</span>}
                                                    </button>
                                                );
                                            })}

                                        {editTagSearch.trim() &&
                                            !availableTags.some((t) => t.toLowerCase() === editTagSearch.trim().toLowerCase()) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTag = editTagSearch.trim();
                                                        const tags = editTagsText
                                                            .split(",")
                                                            .map((t) => t.trim())
                                                            .filter(Boolean);
                                                        setEditTagsText([...tags, newTag].join(", "));
                                                        if (!availableTags.includes(newTag)) {
                                                            setAvailableTags((prev) => {
                                                                const updated = [...prev, newTag];
                                                                localStorage.setItem("promptTags", JSON.stringify(updated));
                                                                return updated;
                                                            });
                                                        }
                                                        setEditTagSearch("");
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-slate-100 text-slate-700 border-t border-slate-100 mt-1 pt-2"
                                                >
                                                    <Plus className="w-3 h-3 inline mr-1" />
                                                    Add "{editTagSearch.trim()}"
                                                </button>
                                            )}
                                    </div>

                                    {editTagsText.trim() && (
                                        <div className="p-2 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-1">
                                                {editTagsText
                                                    .split(",")
                                                    .map((t) => t.trim())
                                                    .filter(Boolean)
                                                    .map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-medium rounded-md"
                                                        >
                                                            #{tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const tags = editTagsText
                                                                        .split(",")
                                                                        .map((t) => t.trim())
                                                                        .filter(Boolean)
                                                                        .filter((t) => t !== tag);
                                                                    setEditTagsText(tags.join(", "));
                                                                }}
                                                                className="hover:text-slate-300 transition-colors"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <AlertDialogCancel className="h-10 px-4 rounded-lg border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="submit"
                            className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-all shadow-none cursor-pointer"
                        >
                            Update Prompt
                        </Button>
                    </div>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
