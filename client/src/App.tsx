
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import ProtectedRoute from "@/components/protected-route";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NewRequisition from "@/pages/new-requisition";
import Requisitions from "@/pages/requisitions";
import UserManagement from "@/pages/user-management";
import FleetManagement from "@/pages/fleet-management";
import Suppliers from "@/pages/suppliers";
import Companies from "@/pages/companies";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/new-requisition" component={NewRequisition} />
            <Route path="/requisitions" component={Requisitions} />
            <Route path="/user-management" component={UserManagement} />
            <Route path="/fleet" component={FleetManagement} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/companies" component={Companies} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppRoutes />
                <Toaster />
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
