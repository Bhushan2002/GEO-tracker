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
} from "@/components/ui/sidebar"

const items  = [
  {
    title: "Overview",
    href : '/'
  },
  {
    title: "Prompt",
    href : '/prompt'
  },
  
  {
    title: "Brand",
    href : '/brand'
  },
  {
    title: "Google Analytics",
    href : '/google-analytics'
  },

  
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            AI 
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <span className="font-medium text-gray-800">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>  
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}