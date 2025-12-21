
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
          <div className="ml-2 pt-2 pl-2 rounded-2xl bg-gray-50 max-w-screen">
          {children}
          </div>
          </main>
      </SidebarProvider>
    </div>
  );
}
