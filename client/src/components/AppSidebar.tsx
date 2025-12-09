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
    title: "EOD Reports",
    icon: FileText,
    url: "/eod-reports",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

type MenuItem = {
  title: string;
  icon: any;
  url: string;
  submenu?: {
    title: string;
    url: string;
    icon: any;
  }[];
};

export default function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-white/5 bg-sidebar/50 backdrop-blur-xl">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 py-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary shadow-lg shadow-primary/20">
                <img src="/rc-logo.png" alt="Company" width={24} height={24} className="shrink-0 invert brightness-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-foreground">Dashboard</span>
                <span className="text-xs text-muted-foreground font-medium">Lite Edition</span>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu className="gap-1">
              {(menuItems as MenuItem[]).map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + '/');

                if (item.submenu) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className="w-full justify-between hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        data-testid={`link-nav-${item.title.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 opacity-70" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                      <SidebarMenuSub className="border-l-white/10 ml-6 pl-2 my-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = location === subItem.url || location.startsWith(subItem.url + '/');
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                data-testid={`link-nav-${subItem.title.toLowerCase().replace(' ', '-')}`}
                                className={`
                                  h-9 rounded-lg transition-all duration-200
                                  ${isSubActive
                                    ? 'bg-white/10 text-foreground font-medium shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                  }
                                `}
                              >
                                <Link href={subItem.url}>
                                  <span className="flex items-center gap-2">
                                    <subItem.icon className="w-4 h-4" />
                                    {subItem.title}
                                  </span>
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`link-nav-${item.title.toLowerCase()}`}
                      className={`
                        h-11 px-4 rounded-xl transition-all duration-200 mb-1
                        ${isActive
                          ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.15)]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }
                      `}
                    >
                      <Link href={item.url}>
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                        <span className={`font-medium ${isActive ? 'text-foreground' : ''}`}>{item.title}</span>
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
