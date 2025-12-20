import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { sideBarMenu } from "@/components/sidebarMenu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen felx">
      <SidebarProvider>
        <AppSidebar />
        <main>
          <div className="pt-2 pl-2">

          {children}
          </div>
          </main>
      </SidebarProvider>
    </div>
  );
}
