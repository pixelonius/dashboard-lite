import { SidebarProvider } from "@/components/ui/sidebar";
import TopHeader from '../TopHeader';

export default function TopHeaderExample() {
  return (
    <SidebarProvider>
      <div className="w-full">
        <TopHeader 
          userName="John Doe" 
          userRole="ADMIN" 
          onLogout={() => console.log('Logout clicked')}
        />
        <div className="p-8">
          <p className="text-muted-foreground">Page content goes here...</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
