import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  Users,
  BarChart3,
  Mail,
  Settings,
  Package,
  Home,
  FileText,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    url: "/home",
  },
  {
    title: "Sales",
    icon: DollarSign,
    url: "/sales",
  },
  {
    title: "Marketing",
    icon: BarChart3,
    url: "/marketing",
    submenu: [
      {
        title: "Content",
        url: "/marketing/content",
        icon: FileText,
      },
      {
        title: "Ad Spend",
        url: "/marketing/ad-spend",
        icon: TrendingUp,
      },
      {
        title: "Email",
        url: "/email",
        icon: Mail,
      },
    ],
  },
  {
    title: "CSM",
    icon: Users,
    url: "/csm",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export default function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/ast-logo.png" alt="Company" width={24} height={24} className="shrink-0" />
              {/* <Package className="w-5 h-5 text-primary" /> */}
              <span className="font-semibold">AST Portal</span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + '/');
                
                if (item.submenu) {
                  // Marketing section - always expanded, no toggle
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton data-testid={`link-nav-${item.title.toLowerCase()}`} className="cursor-default">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.submenu.map((subItem) => {
                          const isSubActive = location === subItem.url || location.startsWith(subItem.url + '/');
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive} data-testid={`link-nav-${subItem.title.toLowerCase().replace(' ', '-')}`}>
                                <Link href={subItem.url}>
                                  <subItem.icon className="w-4 h-4" />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
