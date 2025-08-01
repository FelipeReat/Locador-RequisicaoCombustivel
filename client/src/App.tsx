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
                <Route path="/" component={() => <Dashboard />} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/requisitions" component={Requisitions} />
                <Route path="/new-requisition" component={NewRequisition} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route path="/user-management" component={UserManagement} />
                <Route path="/fleet-management" component={FleetManagement} />
                <Route path="/companies" component={Companies} />
                <Route path="/suppliers" component={Suppliers} />
                <Route path="/edit-values" component={EditValues} />
                <Route>
                  <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Switch>
                        <Route path="/dashboard" component={Dashboard} />
                        <Route path="/requisitions" component={Requisitions} />
                        <Route path="/new-requisition" component={NewRequisition} />
                        <Route path="/reports" component={Reports} />
                        <Route path="/settings" component={Settings} />
                        <Route path="/user-management" component={UserManagement} />
                        <Route path="/fleet-management" component={FleetManagement} />
                        <Route path="/companies" component={Companies} />
                        <Route path="/suppliers" component={Suppliers} />
                        <Route path="/edit-values" component={EditValues} />
                        <Route component={NotFound} />
                      </Switch>
                    </div>
                  </div>
                </Route>
              </Switch>
            </Router>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;