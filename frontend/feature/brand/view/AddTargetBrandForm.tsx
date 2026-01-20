"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { brandAPI } from "@/lib/api/brand.api";
import {
    BadgeCheck,
    Building2,
    ChevronRight,
    FileText,
    Globe,
    Info,
    Plus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddTargetBrandFormProps {
    onSuccess?: () => void;
}

export function AddTargetBrandForm({ onSuccess }: AddTargetBrandFormProps) {
    const [brand_url, setBrand_url] = useState("");
    const [brand_name, setBrand_name] = useState("");
    const [actualBrandName, setActualBrandName] = useState("");
    const [brand_description, setBrand_description] = useState("");
    const [brandType, setBrandType] = useState("");
    const [mainBrand, setMainBrand] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brand_name.trim() || !brand_url.trim()) {
            return toast.error("Please provide both name and URL");
        }

        setIsSubmitting(true);
        try {
            await brandAPI.createTargetBrand({
                brand_name,
                official_url: brand_url,
                actual_brand_name: actualBrandName.trim() || undefined,
                brand_type: brandType.trim() || undefined,
                brand_description: brand_description.trim() || undefined,
                mainBrand: mainBrand || false,
            });
            toast.success("Target brand added!");

            // Reset form
            setBrand_name("");
            setBrand_url("");
            setActualBrandName("");
            setBrandType("");
            setBrand_description("");
            setMainBrand(false);

            // Call success callback
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to add brand.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500 delay-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-slate-400" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 m-0">
                        Add New Target Brand
                    </h2>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="text-slate-400 hover:text-slate-600 cursor-help transition-colors">
                            <Info className="w-4 h-4" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px] text-xs bg-slate-900 text-slate-50 border-slate-800">
                        Adding a brand allows our system to track its mentions across AI
                        responses and calculate visibility scores.
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="p-8">
                <form
                    onSubmit={handleAddBrand}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
                >
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="actualName"
                                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
                            >
                                Legal Name
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <Input
                                    id="actualName"
                                    placeholder="Legal Name"
                                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                                    value={actualBrandName}
                                    onChange={(e) => setActualBrandName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="officialUrl"
                                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
                            >
                                Official URL
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <Input
                                    id="officialUrl"
                                    placeholder="https://example.com"
                                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                                    value={brand_url}
                                    onChange={(e) => setBrand_url(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Meta Info */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="brandName"
                                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
                                >
                                    Brand Name
                                </Label>
                                <Input
                                    id="brandName"
                                    placeholder="e.g. MyBrand"
                                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                                    value={brand_name}
                                    onChange={(e) => setBrand_name(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="brandType"
                                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
                                >
                                    Industry / Category
                                </Label>
                                <Input
                                    id="brandType"
                                    placeholder="e.g. Fintech"
                                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl"
                                    value={brandType}
                                    onChange={(e) => setBrandType(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="description"
                                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
                            >
                                Quick Description
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <Textarea
                                    id="description"
                                    placeholder="Brief brand overview..."
                                    className="pl-10 min-h-[120px] bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-slate-900 focus:border-slate-900 transition-all rounded-xl py-3 resize-none"
                                    value={brand_description}
                                    onChange={(e) => setBrand_description(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Full Width Bottom Action */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 group hover:border-slate-300 transition-all">
                                <Checkbox
                                    id="main"
                                    className="border-slate-400"
                                    checked={mainBrand}
                                    onCheckedChange={(checked: boolean | "indeterminate") =>
                                        setMainBrand(checked === true)
                                    }
                                    disabled={isSubmitting}
                                />
                                <div className="flex flex-col">
                                    <Label
                                        htmlFor="main"
                                        className="text-[13px] font-bold text-slate-900 cursor-pointer"
                                    >
                                        Main Tracking Brand
                                    </Label>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                        Use for comparative gap analysis
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="bg-black text-white px-8 h-12 rounded-xl shadow-lg shadow-slate-100 flex items-center justify-center group transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            <BadgeCheck className="w-4 h-4 text-white" />
                            {isSubmitting ? "Adding..." : "Add to Tracking"}
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
}
