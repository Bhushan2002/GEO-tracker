"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Prompt, ModelResponse } from "@/types";
import { PromptAPI } from "@/lib/api/prompt.api";
import { brandAPI } from "@/lib/api/brand.api";
import { ModelResponseAPI } from "@/lib/api/modelresponse.api";
import { useWorkspace } from "./workspace-context";

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
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [targetBrands, setTargetBrands] = useState<any[]>([]);
    const [modelResponses, setModelResponses] = useState<ModelResponse[]>([]);
    const [allBrands, setAllBrands] = useState<any[]>([]);
    const [brandHistory, setBrandHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchPrompts = useCallback(async () => {
        try {
            const res = await PromptAPI.getAll();
            setPrompts(res.data);
        } catch (error) {
            console.error("Failed to load prompts", error);
        }
    }, []);

    const fetchBrands = useCallback(async () => {
        try {
            const res = await brandAPI.getTargetBrand();
            setTargetBrands(res.data);
        } catch (error) {
            console.error("Failed to load brands", error);
        }
    }, []);

    const fetchResponses = useCallback(async () => {
        try {
            const res = await ModelResponseAPI.getModelResponses();
            setModelResponses(res.data);
        } catch (error) {
            console.error("Failed to load model responses", error);
        }
    }, []);

    const fetchAllBrands = useCallback(async () => {
        try {
            const res = await brandAPI.getBrands();
            setAllBrands(res.data);
        } catch (error) {
            console.error("Failed to load all brands", error);
        }
    }, []);

    const fetchBrandHistory = useCallback(async () => {
        try {
            const res = await brandAPI.getBrandHistory(30);
            setBrandHistory(res.data);
        } catch (error) {
            console.error("Failed to load brand history", error);
        }
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
        setIsLoading(false);
        setHasLoaded(true);
    }, [fetchPrompts, fetchBrands, fetchResponses, fetchAllBrands, fetchBrandHistory]);

    useEffect(() => {
        if (activeWorkspace?._id) {
            refreshAll();
        }
    }, [activeWorkspace?._id, refreshAll]);

    return (
        <DashboardDataContext.Provider
            value={{
                prompts,
                targetBrands,
                modelResponses,
                allBrands,
                brandHistory,
                isLoading: isLoading && !hasLoaded,
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
