'use client'
import PromptDetailsPage from "@/app/(dashboard)/prompt/[id]/page";
import { api } from "@/lib/api/api";
import { PromptAPI } from "@/lib/api/prompt.api";
import { useDashboardData } from "@/lib/contexts/dashboard-data-context";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { cn } from "@/lib/utils";
import { Prompt } from "@/types";
import { MessageSquare, Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AddPromptDialog } from "../components/AddPromptDialog";
import { DeletePromptDialog } from "../components/DeletePromptDialog";
import { EditPromptDialog } from "../components/EditPromptDialog";
import { PromptTable } from "../components/PromptTable";

export default function PromptContent() {
    const { activeWorkspace } = useWorkspace();
    const { prompts, modelResponses, isLoading, refreshPrompts } =
        useDashboardData();
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
    const [isEditPromptOpen, setIsEditPromptOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [editTagsText, setEditTagsText] = useState("");
    const [editTagSearch, setEditTagSearch] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

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
            const tags = tagsText
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
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
            const response = await api.post("/api/prompt/execute-all");
            toast.success(response.data.message || "Prompts execution started!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to execute prompts");
        } finally {
            setIsExecuting(false);
        }
    };

    const handleEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setEditTagsText((prompt.tags || []).join(", "));
        setEditTagSearch("");
        setIsEditPromptOpen(true);
    };

    const handleDelete = (promptId: string) => {
        setPromptToDelete(promptId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!promptToDelete) return;

        try {
            await PromptAPI.delete(promptToDelete);
            toast.success("Prompt deleted successfully!");
            refreshPrompts();
            setIsDeleteDialogOpen(false);
            setPromptToDelete(null);
        } catch (error) {
            toast.error("Failed to delete prompt.");
        }
    };

    const handleUpdatePrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPrompt) return;

        try {
            const tags = editTagsText
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            await PromptAPI.update(editingPrompt._id, {
                tags,
            });

            toast.success("Prompt updated successfully!");
            refreshPrompts();
            setIsEditPromptOpen(false);
            setEditingPrompt(null);
            setEditTagsText("");
        } catch (error) {
            toast.error("Failed to update prompt.");
        }
    };

    const handleRowClick = (prompt: Prompt) => {
        router.push(`/prompt?id=${prompt._id}`);
    };

    const filteredPrompts = prompts.filter((p) => {
        const matchesSearch =
            p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.topic?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === "Active") return p.isScheduled;
        if (activeTab === "Inactive") return !p.isScheduled;
        return true;
    });

    if (selectedPromptId) {
        return <PromptDetailsPage manualId={selectedPromptId} />;
    }

    function setNewTag(value: string): void {
        throw new Error("Function not implemented.");
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
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                                AI Prompts
                            </h1>
                            <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
                                Build, test, and schedule prompts to monitor how AI models
                                perceive and rank your brand.
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
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Add Prompt Dialog */}
            <AddPromptDialog
                isOpen={isAddPromptOpen}
                onOpenChange={setIsAddPromptOpen}
                promptText={promptText}
                setPromptText={setPromptText}
                topic={topic}
                setTopic={setTopic}
                topics={topics}
                newTopic={newTopic}
                setNewTopic={setNewTopic}
                tagsText={tagsText}
                setTagsText={setTagsText}
                availableTags={availableTags}
                setAvailableTags={setAvailableTags}
                tagSearch={tagSearch}
                setTagSearch={setTagSearch}
                onSubmit={handleAddPrompt}
                onAddTopic={handleAddTopic}
            />

            {/* Edit Prompt Dialog */}
            <EditPromptDialog
                isOpen={isEditPromptOpen}
                onOpenChange={setIsEditPromptOpen}
                editingPrompt={editingPrompt}
                editTagsText={editTagsText}
                setEditTagsText={setEditTagsText}
                availableTags={availableTags}
                setAvailableTags={setAvailableTags}
                editTagSearch={editTagSearch}
                setEditTagSearch={setEditTagSearch}
                onSubmit={handleUpdatePrompt}
            />

            {/* Delete Confirmation Dialog */}
            <DeletePromptDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
