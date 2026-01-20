"use client";


import PromptContent from "@/feature/prompt/view/PromptContent";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Prompt management page.
 * Allows users to create, execute, and organize prompts for AI tracking.
 * Wraps content in Suspense for search params handling.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8 min-h-screen space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-96 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      }
    >
      <PromptContent />
    </Suspense>
  );
}
