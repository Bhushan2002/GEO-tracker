"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// --- Types ---

interface Workspace {
    _id: string;
    name: string;
    type: string;
    memberCount: number;
    isDefault: boolean;
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (workspace: Workspace) => void;
    isLoading: boolean;
    refreshWorkspaces: () => Promise<void>;
}

// --- Context Definition ---

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

/**
 * Provider component for managing Workspace state globally.
 * Handles fetching, selecting, and persisting the active workspace.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- Actions ---

    const fetchWorkspaces = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/workspaces");
            const data = await response.json();
            setWorkspaces(data);

            // Workspace Selection Logic:
            // 1. Try to restore from localStorage
            // 2. Fallback to the first available workspace
            const savedId = localStorage.getItem("selectedWorkspaceId");
            const saved = data.find((w: Workspace) => w._id === savedId);
            const initial = saved || data[0] || null;

            setActiveWorkspace(initial);

            // Sync localStorage if we fell back to a default
            if (initial && (!savedId || savedId !== initial._id)) {
                localStorage.setItem("selectedWorkspaceId", initial._id);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetActiveWorkspace = (workspace: Workspace) => {
        setActiveWorkspace(workspace);
        // Persist selection to survive page reloads
        localStorage.setItem("selectedWorkspaceId", workspace._id);
    };

    // --- Effects ---

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                activeWorkspace,
                setActiveWorkspace: handleSetActiveWorkspace,
                isLoading,
                refreshWorkspaces: fetchWorkspaces
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

/**
 * Hook to access the Workspace context.
 * Throws an error if used outside of WorkspaceProvider.
 */
export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
