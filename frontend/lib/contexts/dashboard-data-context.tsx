"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Prompt, ModelResponse } from "@/types";
import { PromptAPI } from "@/api/prompt.api";
import { brandAPI } from "@/api/brand.api";
import { ModelResponseAPI } from "@/api/modelresponse.api";
import { useWorkspace } from "./workspace-context";
import { DUMMY_ALL_BRANDS, DUMMY_BRAND_HISTORY, DUMMY_MODEL_RESPONSES, DUMMY_PROMPTS, DUMMY_TARGET_BRANDS } from "../dummy-data";

interface DashboardDataContextType {
    prompts: Prompt[];
    targetBrands: any[];
    modelResponses: ModelResponse[];
    allBrands: any[];
    brandHistory: any[];
    isLoading: boolean;
    refreshAll: () => Promise<void>;
    refreshPrompts: () => Promise<void>;
    refreshBrands: () => Promise<void>;
    refreshResponses: () => Promise<void>;
    refreshAllBrands: () => Promise<void>;
    refreshBrandHistory: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
    const { activeWorkspace } = useWorkspace();
    const [prompts, setPrompts] = useState<Prompt[]>(DUMMY_PROMPTS as any);
    const [targetBrands, setTargetBrands] = useState<any[]>(DUMMY_TARGET_BRANDS);
    const [modelResponses, setModelResponses] = useState<ModelResponse[]>(DUMMY_MODEL_RESPONSES as any);
    const [allBrands, setAllBrands] = useState<any[]>(DUMMY_ALL_BRANDS);
    const [brandHistory, setBrandHistory] = useState<any[]>(DUMMY_BRAND_HISTORY);
    const [isLoading, setIsLoading] = useState(false); // Initially false because we have dummy data

    const fetchPrompts = useCallback(async () => {
        setPrompts(DUMMY_PROMPTS as any);
    }, []);

    const fetchBrands = useCallback(async () => {
        setTargetBrands(DUMMY_TARGET_BRANDS);
    }, []);

    const fetchResponses = useCallback(async () => {
        setModelResponses(DUMMY_MODEL_RESPONSES as any);
    }, []);

    const fetchAllBrands = useCallback(async () => {
        setAllBrands(DUMMY_ALL_BRANDS);
    }, []);

    const fetchBrandHistory = useCallback(async () => {
        setBrandHistory(DUMMY_BRAND_HISTORY);
    }, []);

    const refreshAll = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([
            fetchPrompts(),
            fetchBrands(),
            fetchResponses(),
            fetchAllBrands(),
            fetchBrandHistory(),
        ]);
        setTimeout(() => setIsLoading(false), 300); // Tiny artificial delay
    }, [fetchPrompts, fetchBrands, fetchResponses, fetchAllBrands, fetchBrandHistory]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return (
        <DashboardDataContext.Provider
            value={{
                prompts,
                targetBrands,
                modelResponses,
                allBrands,
                brandHistory,
                isLoading,
                refreshAll,
                refreshPrompts: fetchPrompts,
                refreshBrands: fetchBrands,
                refreshResponses: fetchResponses,
                refreshAllBrands: fetchAllBrands,
                refreshBrandHistory: fetchBrandHistory,
            }}
        >
            {children}
        </DashboardDataContext.Provider>
    );
}

export function useDashboardData() {
    const context = useContext(DashboardDataContext);
    if (context === undefined) {
        throw new Error("useDashboardData must be used within a DashboardDataProvider");
    }
    return context;
}
