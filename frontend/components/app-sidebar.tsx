"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  ChartBar,
  Bot
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const generalItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Prompts",
    href: "/prompt",
    icon: MessageSquare,
  },
  {
    title: "Sources",
    href: "/sources",
    icon: Globe,
  },
  {
    title: "Models",
    href: "/models",
    icon: Bot,
  },
  {
    title: "Brands",
    href: "/brand",
    icon: Tag,
  },
  {
    title: "Google Analytics",
    href: "/google-analytics",
    icon: BarChart3,
  },
];

const preferencesItems = [
  {
    title: "Brands",
    href: "/brand",
    icon: Tag,
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
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="p-4 bg-sidebar group-data-[collapsible=icon]:p-2">
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 bg-sidebar gap-6">
        {/* General Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-foreground/50 mb-2 group-data-[collapsible=icon]:hidden">
            Pages
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
                    >
                      <Link href={item.href} className="flex items-center gap-3 font-medium">
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>
      {/* Footer with Log Out Only */}
      <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log Out"
              className="text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full justify-start select-none"
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden font-medium">
                Log Out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar >
  );
}
