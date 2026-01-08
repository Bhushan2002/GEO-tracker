"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { WorkspaceProvider, useWorkspace } from "@/lib/contexts/workspace-context";
import * as React from "react";

import { DashboardDataProvider } from "@/lib/contexts/dashboard-data-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-y-auto bg-background"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

/**
 * Layout wrapper for the dashboard section.
 * Provides the sidebar, workspace context, and dashboard data context.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <DashboardDataProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <DashboardContent>
                {children}
              </DashboardContent>
            </main>
          </div>
        </DashboardDataProvider>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
