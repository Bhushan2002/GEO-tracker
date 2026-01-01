"use client";

import * as React from "react";
import {
    Check,
    ChevronDown,
    Plus,
    Search,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function WorkspaceSwitcher() {
    const { workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces } = useWorkspace();
    const { state } = useSidebar();
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isCreating, setIsCreating] = React.useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = React.useState("");

    const filteredWorkspaces = workspaces.filter((w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;

        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWorkspaceName }),
            });

            if (res.ok) {
                await refreshWorkspaces();
                setNewWorkspaceName("");
                setIsCreating(false);
                toast.success("Workspace created successfully");
            }
        } catch (err) {
            console.error("Failed to create workspace:", err);
            toast.error("Failed to create workspace");
        }
    };

    if (!activeWorkspace) return null;

    return (
        <TooltipProvider delayDuration={400}>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 text-left shadow-sm transition-all hover:bg-gray-50 outline-none focus:ring-2 focus:ring-black/5",
                            state === "collapsed" && "justify-center p-0 h-9 border-none shadow-none bg-transparent"
                        )}
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black text-[10px] font-bold text-white uppercase">
                            {activeWorkspace.name.substring(0, 1)}
                        </div>
                        {state === "expanded" && (
                            <>
                                <div className="flex flex-1 flex-col">
                                    <span className="text-sm font-semibold text-gray-900 leading-tight break-words">
                                        {activeWorkspace.name}
                                    </span>
                                </div>
                                <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200", open && "rotate-180")} />
                            </>
                        )}
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        className="z-[100] w-[260px] animate-in fade-in zoom-in-95 rounded-xl border border-gray-200 bg-white p-1 shadow-xl outline-none"
                    >
                        <div className="p-2">
                            <div className="px-2 py-1.5 text-left">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Workspaces
                                </span>
                            </div>

                            <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="w-full rounded-md border border-gray-100 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-gray-200"
                                    placeholder="Search workspace"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[240px] overflow-y-auto space-y-1 mt-2">
                                {filteredWorkspaces.map((workspace) => (
                                    <div
                                        key={workspace._id}
                                        onClick={() => {
                                            setActiveWorkspace(workspace);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-gray-50 group relative cursor-pointer",
                                            activeWorkspace._id === workspace._id && "bg-gray-50 shadow-sm"
                                        )}
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-200 text-xs font-bold text-gray-600 uppercase">
                                            {workspace.name.substring(0, 1)}
                                        </div>
                                        <div className="flex flex-1 flex-col">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-medium text-gray-900 leading-tight break-words">
                                                    {workspace.name}
                                                </span>
                                            </div>
                                        </div>
                                        {activeWorkspace._id === workspace._id && (
                                            <Check className="h-4 w-4 text-black" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-2 border-t border-gray-100 pt-2 px-1">
                                {!isCreating ? (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="flex w-full items-center gap-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90 active:scale-[0.98]"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create Workspace
                                    </button>
                                ) : (
                                    <form onSubmit={handleCreateWorkspace} className="space-y-2">
                                        <input
                                            autoFocus
                                            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
                                            placeholder="Workspace name..."
                                            value={newWorkspaceName}
                                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="submit"
                                                className="flex-1 rounded-md bg-black py-1.5 text-xs font-medium text-white hover:bg-black/90"
                                            >
                                                Create
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreating(false)}
                                                className="flex-1 rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </TooltipProvider>
    );
}
