
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { ThemeProvider } from "./contexts/theme-context";
import { LanguageProvider } from "./contexts/language-context";
import { NotificationProvider } from "./contexts/notification-context";
import { Toaster } from "./components/ui/toaster";
import Sidebar from "./components/layout/sidebar";

// Pages
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Requisitions from "./pages/requisitions";
import NewRequisition from "./pages/new-requisition";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import UserManagement from "./pages/user-management";
import FleetManagement from "./pages/fleet-management";
import Companies from "./pages/companies";
import Suppliers from "./pages/suppliers";
import EditValues from "./pages/edit-values";
import NotFound from "./pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <Toaster />
            <Router>
              <Switch>
                <Route path="/login" component={Login} />
                <Route path="/" component={() => (
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                )} />
                <Route path="/dashboard" component={() => (
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                )} />
                <Route path="/requisitions" component={() => (
                  <AppLayout>
                    <Requisitions />
                  </AppLayout>
                )} />
                <Route path="/new-requisition" component={() => (
                  <AppLayout>
                    <NewRequisition />
                  </AppLayout>
                )} />
                <Route path="/reports" component={() => (
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                )} />
                <Route path="/settings" component={() => (
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                )} />
                <Route path="/user-management" component={() => (
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                )} />
                <Route path="/fleet-management" component={() => (
                  <AppLayout>
                    <FleetManagement />
                  </AppLayout>
                )} />
                <Route path="/companies" component={() => (
                  <AppLayout>
                    <Companies />
                  </AppLayout>
                )} />
                <Route path="/suppliers" component={() => (
                  <AppLayout>
                    <Suppliers />
                  </AppLayout>
                )} />
                <Route path="/edit-values" component={() => (
                  <AppLayout>
                    <EditValues />
                  </AppLayout>
                )} />
                <Route component={() => (
                  <AppLayout>
                    <NotFound />
                  </AppLayout>
                )} />
              </Switch>
            </Router>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
