import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationProvider } from "@/contexts/notification-context";
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

function Router() {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/requisitions" component={Requisitions} />
          <Route path="/new-requisition" component={NewRequisition} />
          <Route path="/reports" component={Reports} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/fleet-management" component={FleetManagement} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/companies" component={Companies} />
          <Route path="/fleet-management" component={FleetManagement} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/user-management" component={UserManagement} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;