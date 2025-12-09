import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppSidebar from "@/components/AppSidebar";
import TopHeader from "@/components/TopHeader";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Sales from "@/pages/Sales";
import MarketingContent from "@/pages/MarketingContent";
import MarketingAdSpend from "@/pages/MarketingAdSpend";
import Email from "@/pages/Email";
import Settings from "@/pages/Settings";
import CloserEOD from "@/pages/CloserEOD";
import SetterEOD from "@/pages/SetterEOD";
import DmSetterEOD from "@/pages/DmSetterEOD";
import EODReports from "@/pages/EODReports";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopHeader
            userName={user?.name || ''}
            userRole={user?.role || ''}
            onLogout={logout}
          />
          <main className="flex-1 overflow-y-auto bg-background p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';

    switch (user.role) {
      case 'SALES':
        return '/sales';
      case 'MARKETING':
        return '/marketing/content';
      case 'ADMIN':
      default:
        return '/home';
    }
  };

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/closer-eod" component={CloserEOD} />
      <Route path="/setter-eod" component={SetterEOD} />
      <Route path="/dmsetter-eod" component={DmSetterEOD} />
      <Route path="/">
        {() => <Redirect to={getDefaultRoute()} />}
      </Route>
      <Route path="/home">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Home />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/sales">
        <ProtectedRoute allowedRoles={['SALES', 'ADMIN']}>
          <AuthenticatedLayout>
            <Sales />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/marketing">
        {() => <Redirect to="/marketing/content" />}
      </Route>
      <Route path="/marketing/content">
        <ProtectedRoute allowedRoles={['MARKETING', 'ADMIN']}>
          <AuthenticatedLayout>
            <MarketingContent />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/marketing/ad-spend">
        <ProtectedRoute allowedRoles={['MARKETING', 'ADMIN']}>
          <AuthenticatedLayout>
            <MarketingAdSpend />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/email">
        <ProtectedRoute allowedRoles={['MARKETING', 'ADMIN']}>
          <AuthenticatedLayout>
            <Email />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/eod-reports">
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
          <AuthenticatedLayout>
            <EODReports />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
