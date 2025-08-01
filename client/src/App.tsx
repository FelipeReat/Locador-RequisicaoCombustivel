import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/*"
              element={
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/requisitions" element={<Requisitions />} />
                      <Route path="/new-requisition" element={<NewRequisition />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/user-management" element={<UserManagement />} />
                      <Route path="/fleet-management" element={<FleetManagement />} />
                      <Route path="/companies" element={<Companies />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/edit-values" element={<EditValues />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
        </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;