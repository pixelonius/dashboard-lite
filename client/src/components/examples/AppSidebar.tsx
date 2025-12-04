import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from '../AppSidebar';

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 p-8 bg-background">
          <h2 className="text-2xl font-bold">Sidebar Navigation</h2>
          <p className="text-muted-foreground mt-2">Click on the sidebar items to navigate</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
