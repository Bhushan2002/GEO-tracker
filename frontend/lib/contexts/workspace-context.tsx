"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DUMMY_WORKSPACES } from "../dummy-data";

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

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWorkspaces = async () => {
        setIsLoading(true);
        try {
            // SKIP API: const response = await fetch("/api/workspaces");
            // SKIP API: const data = await response.json();
            const data = DUMMY_WORKSPACES;
            setWorkspaces(data);

            // Restore selected workspace from localStorage or pick first
            const savedId = localStorage.getItem("selectedWorkspaceId");
            const saved = data.find((w: Workspace) => w._id === savedId);
            const initial = saved || data[0] || null;
            setActiveWorkspace(initial);

            // Ensure localStorage is set for initial or fallback workspace
            if (initial && (!savedId || savedId !== initial._id)) {
                localStorage.setItem("selectedWorkspaceId", initial._id);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const handleSetActiveWorkspace = (workspace: Workspace) => {
        setActiveWorkspace(workspace);
        localStorage.setItem("selectedWorkspaceId", workspace._id);
    };

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

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
