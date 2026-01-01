"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Radar,
  BarChart4
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { LayoutGrid } from "lucide-react";

const items = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Prompts",
    href: "/prompt",
    icon: MessageSquare,
  },
  {
    title: "Brands",
    href: "/brand",
    icon: Tag,
  },
  // {
  //   title: "Audiences",
  //   href: "/audiences",
  //   icon: Users,
  // },
  {
    title: "Google Analytics",
    href: "/google-analytics",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white shadow-sm">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 transition-all">
        <div className="flex items-center gap-3 mb-5 group-data-[collapsible=icon]:mb-0 overflow-hidden px-1">
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AI Search Analytics
            </span>
          </div>
        </div>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 group-data-[collapsible=icon]:hidden">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.title} className="mb-1">
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center w-full gap-3"
                      >
                        <item.icon
                          className={cn("h-5 w-5 shrink-0", "text-gray-400")}
                        />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-black group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 px-4 border-t border-gray-100">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* <SidebarMenuButton
              asChild
              tooltip="Settings"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Link href="/settings" className="flex items-center w-full gap-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <span className="group-data-[collapsible=icon]:hidden font-medium">
                  Settings
                </span>
              </Link>
            </SidebarMenuButton> */}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log Out"
              className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors w-full"
            >
              <LogOut className="h-5 w-5 text-red-400" />
              <span className="group-data-[collapsible=icon]:hidden font-medium">
                Log Out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
