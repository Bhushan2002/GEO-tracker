"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { WorkspaceProvider, useWorkspace } from "@/lib/contexts/workspace-context";
import * as React from "react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { activeWorkspace } = useWorkspace();

  return (
    <div
      key={activeWorkspace?._id}
      className="flex-1 overflow-y-auto bg-background"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <DashboardContent>
              {children}
            </DashboardContent>
          </main>
        </div>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
