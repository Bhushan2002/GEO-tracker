
import { sideBarMenu } from "@/components/sidebarMenu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="w-full min-h-screen bg-gray-100">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
