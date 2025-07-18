import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Mail,
  Settings,
  Target,
  Users,
  Zap
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "../ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "dashboard",
    icon: Home,
  },
  {
    title: "Leads",
    url: "leads",
    icon: Users,
  },
  {
    title: "Campaigns",
    url: "campaigns",
    icon: Target,
  },
  {
    title: "AI Outreach",
    url: "outreach",
    icon: Zap,
  },
  {
    title: "Calendar",
    url: "calendar",
    icon: Calendar,
  },
  {
    title: "Reports",
    url: "reports",
    icon: BarChart3,
  },
]

const settingsItems = [
  {
    title: "Settings",
    url: "settings",
    icon: Settings,
  },
  {
    title: "Billing",
    url: "billing",
    icon: CreditCard,
  },
]

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <img src="/loopreach-logo.png" alt="Loopreach.io" className="w-8 h-8" />
          <span className="font-semibold text-lg">Loopreach.io</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={currentPage === item.url}
                  >
                    <button 
                      onClick={() => onPageChange(item.url)}
                      className="w-full flex items-center"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={currentPage === item.url}
                  >
                    <button 
                      onClick={() => onPageChange(item.url)}
                      className="w-full flex items-center"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
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