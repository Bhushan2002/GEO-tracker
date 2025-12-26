
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
  
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
