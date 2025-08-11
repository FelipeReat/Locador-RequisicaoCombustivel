import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/dashboard";
import Requisitions from "@/pages/requisitions";
import NewRequisition from "@/pages/new-requisition";
import Reports from "@/pages/reports";
import UserManagement from "@/pages/user-management";
import FleetManagement from "@/pages/fleet-management";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Suppliers from "@/pages/suppliers";
import Companies from "@/pages/companies";
import Login from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 ml-0 min-w-0">
        <Switch>
          <Route path="/">
            <ProtectedRoute path="/dashboard">
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute path="/dashboard">
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/requisitions">
            <ProtectedRoute path="/requisitions">
              <Requisitions />
            </ProtectedRoute>
          </Route>
          <Route path="/new-requisition">
            <ProtectedRoute path="/new-requisition">
              <NewRequisition />
            </ProtectedRoute>
          </Route>
          <Route path="/reports">
            <ProtectedRoute path="/reports">
              <Reports />
            </ProtectedRoute>
          </Route>
          <Route path="/user-management">
            <ProtectedRoute path="/user-management">
              <UserManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/fleet-management">
            <ProtectedRoute path="/fleet-management">
              <FleetManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/suppliers">
            <ProtectedRoute path="/suppliers">
              <Suppliers />
            </ProtectedRoute>
          </Route>
          <Route path="/companies">
            <ProtectedRoute path="/companies">
              <Companies />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute path="/settings">
              <Settings />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;