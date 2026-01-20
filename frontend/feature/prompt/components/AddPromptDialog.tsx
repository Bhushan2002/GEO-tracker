"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface AddPromptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    promptText: string;
    setPromptText: (text: string) => void;
    topic: string;
    setTopic: (topic: string) => void;
    topics: string[];
    newTopic: string;
    setNewTopic: (topic: string) => void;
    tagsText: string;
    setTagsText: (tags: string) => void;
    availableTags: string[];
    setAvailableTags: React.Dispatch<React.SetStateAction<string[]>>;
    tagSearch: string;
    setTagSearch: (search: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onAddTopic: () => void;
}

export function AddPromptDialog({
    isOpen,
    onOpenChange,
    promptText,
    setPromptText,
    topic,
    setTopic,
    topics,
    newTopic,
    setNewTopic,
    tagsText,
    setTagsText,
    availableTags,
    setAvailableTags,
    tagSearch,
    setTagSearch,
    onSubmit,
    onAddTopic,
}: AddPromptDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg bg-white rounded-xl p-0 overflow-hidden border border-slate-200 shadow-lg">
                <div className="px-6 py-4 border-b border-slate-100">
                    <AlertDialogTitle className="text-lg font-bold text-slate-900">
                        New Prompt
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-slate-500 mt-0.5">
                        Configure a new prompt to track AI sentiment.
                    </AlertDialogDescription>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5 bg-white">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">
                            Prompt Text
                        </label>
                        <textarea
                            placeholder="Enter prompt criteria..."
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">
                                Topic
                            </label>
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
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                (e.preventDefault(), onAddTopic())
                                            }
                                            className="h-8 text-xs rounded-md border-slate-100"
                                        />
                                    </div>
                                    <div className="max-h-[220px] overflow-y-auto p-1">
                                        {topics.map((t) => (
                                            <SelectItem
                                                key={t}
                                                value={t}
                                                className="text-xs rounded-md cursor-pointer"
                                            >
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </div>
                                </SelectContent>
                            </Select>
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
                                            {tagsText.trim() || "Select tags"}
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
                                                value={tagSearch}
                                                onChange={(e) => setTagSearch(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && tagSearch.trim()) {
                                                        e.preventDefault();
                                                        const newTag = tagSearch.trim();
                                                        const tags = tagsText
                                                            .split(",")
                                                            .map((t) => t.trim())
                                                            .filter(Boolean);
                                                        if (!tags.some((t) => t.toLowerCase() === newTag.toLowerCase())) {
                                                            setTagsText([...tags, newTag].join(", "));
                                                            if (!availableTags.includes(newTag)) {
                                                                setAvailableTags((prev) => {
                                                                    const updated = [...prev, newTag];
                                                                    localStorage.setItem("promptTags", JSON.stringify(updated));
                                                                    return updated;
                                                                });
                                                            }
                                                        }
                                                        setTagSearch("");
                                                    }
                                                }}
                                                className="h-8 text-xs rounded-md border-slate-100 pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto p-1">
                                        {availableTags
                                            .filter((tag) =>
                                                tag.toLowerCase().includes(tagSearch.toLowerCase())
                                            )
                                            .map((tag) => {
                                                const isSelected = tagsText
                                                    .split(",")
                                                    .map((t) => t.trim().toLowerCase())
                                                    .includes(tag.toLowerCase());
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            const tags = tagsText
                                                                .split(",")
                                                                .map((t) => t.trim())
                                                                .filter(Boolean);
                                                            if (isSelected) {
                                                                setTagsText(
                                                                    tags
                                                                        .filter((t) => t.toLowerCase() !== tag.toLowerCase())
                                                                        .join(", ")
                                                                );
                                                            } else {
                                                                setTagsText([...tags, tag].join(", "));
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

                                        {tagSearch.trim() &&
                                            !availableTags.some((t) => t.toLowerCase() === tagSearch.trim().toLowerCase()) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTag = tagSearch.trim();
                                                        const tags = tagsText
                                                            .split(",")
                                                            .map((t) => t.trim())
                                                            .filter(Boolean);
                                                        setTagsText([...tags, newTag].join(", "));
                                                        if (!availableTags.includes(newTag)) {
                                                            setAvailableTags((prev) => {
                                                                const updated = [...prev, newTag];
                                                                localStorage.setItem("promptTags", JSON.stringify(updated));
                                                                return updated;
                                                            });
                                                        }
                                                        setTagSearch("");
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-slate-100 text-slate-700 border-t border-slate-100 mt-1 pt-2"
                                                >
                                                    <Plus className="w-3 h-3 inline mr-1" />
                                                    Add "{tagSearch.trim()}"
                                                </button>
                                            )}
                                    </div>

                                    {tagsText.trim() && (
                                        <div className="p-2 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-1">
                                                {tagsText
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
                                                                    const tags = tagsText
                                                                        .split(",")
                                                                        .map((t) => t.trim())
                                                                        .filter(Boolean)
                                                                        .filter((t) => t !== tag);
                                                                    setTagsText(tags.join(", "));
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
                            Save Prompt
                        </Button>
                    </div>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
