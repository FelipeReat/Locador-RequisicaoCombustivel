import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FleetManagement from "./fleet-management";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SystemSettingsProvider } from "@/contexts/system-settings-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mocks
vi.mock("wouter", () => ({
  useLocation: () => ["/fleet-management", vi.fn()],
  Redirect: () => null,
}));

vi.mock("@/contexts/auth-context", async () => {
  const actual = await vi.importActual("@/contexts/auth-context");
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, role: "admin", name: "Admin User" },
      isLoading: false,
    }),
  };
});

// Mock apiRequest
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactNode) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <SystemSettingsProvider>
            <TooltipProvider>
              {ui}
              <Toaster />
            </TooltipProvider>
          </SystemSettingsProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe("FleetManagement View Toggle", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should default to grid view", async () => {
    renderWithProviders(<FleetManagement />);
    
    // Check if grid view specific element exists (e.g., layout grid icon active or card elements)
    // We can check for the "Visualização em Grade" button being active (variant="secondary")
    const gridButton = screen.getByTitle("Visualização em Grade");
    expect(gridButton).toHaveClass("bg-secondary");
    
    const listButton = screen.getByTitle("Visualização em Lista");
    expect(listButton).not.toHaveClass("bg-secondary");
  });

  it("should switch to list view when list button is clicked", async () => {
    renderWithProviders(<FleetManagement />);
    
    const listButton = screen.getByTitle("Visualização em Lista");
    fireEvent.click(listButton);

    // Check if list view is active
    expect(listButton).toHaveClass("bg-secondary");
    const gridButton = screen.getByTitle("Visualização em Grade");
    expect(gridButton).not.toHaveClass("bg-secondary");
    
    // Check if localStorage was updated
    expect(localStorage.getItem("fleet-view-mode")).toBe("list");
  });

  it("should persist view preference in localStorage", async () => {
    localStorage.setItem("fleet-view-mode", "list");
    renderWithProviders(<FleetManagement />);
    
    const listButton = screen.getByTitle("Visualização em Lista");
    expect(listButton).toHaveClass("bg-secondary");
  });

  it("should render table in list view", async () => {
    localStorage.setItem("fleet-view-mode", "list");
    renderWithProviders(<FleetManagement />);
    
    // In list view, we expect table headers
    expect(screen.getByText("Placa")).toBeInTheDocument(); // Assuming 'plate' translates to 'Placa' or check for translation key if mock returns key
    // Since we mock t(), it might return the key. Let's check the mock implementation or assumption.
    // The real useLanguage hook returns t function.
  });
});
