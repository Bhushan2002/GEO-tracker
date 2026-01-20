"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface DeletePromptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function DeletePromptDialog({
    isOpen,
    onOpenChange,
    onConfirm,
}: DeletePromptDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md bg-white rounded-xl p-0 overflow-hidden border border-slate-200 shadow-lg">
                <div className="px-6 py-4 border-b border-slate-100">
                    <AlertDialogTitle className="text-lg font-bold text-slate-900">
                        Delete Prompt
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-slate-500 mt-0.5">
                        Are you sure you want to delete this prompt?
                    </AlertDialogDescription>
                </div>

                <div className="p-6 flex items-center justify-end gap-3">
                    <AlertDialogCancel className="h-10 px-4 rounded-lg border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        onClick={onConfirm}
                        className="h-10 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-all shadow-none cursor-pointer"
                    >
                        Delete
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
