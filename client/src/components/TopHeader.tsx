import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface TopHeaderProps {
  userName: string;
  userRole: string;
  onLogout?: () => void;
}

export default function TopHeader({ userName, userRole, onLogout }: TopHeaderProps) {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div>
          <h1 className="text-sm font-semibold">Welcome back, {userName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={userRole} variant="info" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
