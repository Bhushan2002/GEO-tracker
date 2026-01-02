"use client";

import * as React from "react";
import {
    Check,
    ChevronDown,
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

    const filteredWorkspaces = workspaces.filter((w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    if (!activeWorkspace) return null;

    return (
        <TooltipProvider delayDuration={400}>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        className={cn(
                            "flex w-full items-center gap-2 rounded-lg p-2 text-left transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
                            state === "collapsed" && "justify-center p-0 h-9 w-9 bg-transparent",
                            open && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                    >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground uppercase shadow-sm">
                            {activeWorkspace.name.substring(0, 1)}
                        </div>
                        {state === "expanded" && (
                            <>
                                <div className="flex flex-1 flex-col">
                                    <span className="text-sm font-semibold whitespace-normal break-words leading-tight">
                                        {activeWorkspace.name}
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                            </>
                        )}
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        className="z-[100] w-[220px] rounded-lg border border-border bg-popover p-1 shadow-md outline-none"
                    >
                        <div className="p-1">
                            <div className="px-2 py-1.5 text-left">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Workspaces
                                </span>
                            </div>

                            <div className="relative mb-2 px-1">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    className="w-full rounded-md border border-input bg-muted/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:bg-background focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[200px] overflow-y-auto space-y-0.5 mt-1">
                                {filteredWorkspaces.map((workspace) => (
                                    <div
                                        key={workspace._id}
                                        onClick={() => {
                                            setActiveWorkspace(workspace);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-sm p-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none",
                                            activeWorkspace._id === workspace._id && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground uppercase shadow-sm">
                                            {workspace.name.substring(0, 1)}
                                        </div>
                                        <span className="flex-1 whitespace-normal break-words text-sm leading-tight">
                                            {workspace.name}
                                        </span>
                                        {activeWorkspace._id === workspace._id && (
                                            <Check className="h-4 w-4 shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>

                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </TooltipProvider>
    );
}
