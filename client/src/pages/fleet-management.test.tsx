import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FleetManagement from "./fleet-management";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SystemSettingsProvider } from "@/contexts/system-settings-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mocks
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
    removeItem: function (key: string) {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

vi.mock("wouter", () => ({
  useLocation: () => ["/fleet-management", () => {}],
  Redirect: () => null,
}));

vi.mock("@/contexts/auth-context", () => ({
  AuthProvider: ({ children }: { children: any }) => children,
  useAuth: () => ({
    user: { id: 1, role: "admin", name: "Admin User" },
    isLoading: false,
  }),
}));

vi.mock("@/contexts/theme-context", () => ({
  useTheme: () => ({ theme: "light", setTheme: () => {} }),
  ThemeProvider: ({ children }: { children: any }) => children,
}));

// Mock apiRequest
vi.mock("@/lib/queryClient", () => ({
  apiRequest: () => Promise.resolve({ json: () => Promise.resolve({}) }),
  queryClient: {
    invalidateQueries: () => {},
    getQueryData: () => {},
    setQueryData: () => {},
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const res = await fetch(url);
        return res.json();
      },
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
    
     global.fetch = vi.fn((url) => {
       if (url === "/api/vehicles") {
         return Promise.resolve({
           ok: true,
           json: () => Promise.resolve([
             { id: 1, plate: "ABC-1234", model: "Model A", brand: "Brand A", vehicleTypeId: 1, status: "active", fuelType: "gasolina", year: 2020 },
             { id: 2, plate: "XYZ-5678", model: "Model B", brand: "Brand B", vehicleTypeId: 2, status: "maintenance", fuelType: "diesel", year: 2021 },
             { id: 3, plate: "DEF-9012", model: "Model C", brand: "Brand C", vehicleTypeId: null, status: "active", fuelType: "flex", year: 2022 },
           ]),
         });
       }
       if (url === "/api/vehicle-types") {
         return Promise.resolve({
           ok: true,
           json: () => Promise.resolve([
             { id: 1, name: "Sedan", active: true },
             { id: 2, name: "Caminhão", active: true },
           ]),
         });
       }
       if (url === "/api/companies") {
         return Promise.resolve({
             ok: true,
             json: () => Promise.resolve([]),
         })
       }
       return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
     }) as any;
  });

  it("should default to grid view", async () => {
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });

    const gridButton = screen.getByTitle("Visualização em Grade");
    expect(gridButton).toHaveClass("bg-secondary");
    
    const listButton = screen.getByTitle("Visualização em Lista");
    expect(listButton).not.toHaveClass("bg-secondary");
  });

  it("should switch to list view when list button is clicked", async () => {
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });

    const listButton = screen.getByTitle("Visualização em Lista");
    fireEvent.click(listButton);

    expect(listButton).toHaveClass("bg-secondary");
    const gridButton = screen.getByTitle("Visualização em Grade");
    expect(gridButton).not.toHaveClass("bg-secondary");
    
    expect(localStorage.getItem("fleet-view-mode")).toBe("list");
  });

  it("should persist view preference in localStorage", async () => {
    localStorage.setItem("fleet-view-mode", "list");
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });
    
    const listButton = screen.getByTitle("Visualização em Lista");
    expect(listButton).toHaveClass("bg-secondary");
  });

  it("should render table in list view", async () => {
    localStorage.setItem("fleet-view-mode", "list");
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Placa")).toBeInTheDocument();
    expect(screen.getByText("Modelo")).toBeInTheDocument();
    expect(screen.getByText("Marca")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});

describe("FleetManagement New Features", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
     global.fetch = vi.fn((url) => {
       if (url === "/api/vehicles") {
         return Promise.resolve({
           ok: true,
           json: () => Promise.resolve([
             { id: 1, plate: "ABC-1234", model: "Model A", brand: "Brand A", vehicleTypeId: 1, status: "active", fuelType: "gasolina", year: 2020 },
             { id: 2, plate: "XYZ-5678", model: "Model B", brand: "Brand B", vehicleTypeId: 2, status: "maintenance", fuelType: "diesel", year: 2021 },
             { id: 3, plate: "DEF-9012", model: "Model C", brand: "Brand C", vehicleTypeId: null, status: "active", fuelType: "flex", year: 2022 },
           ]),
         });
       }
       if (url === "/api/vehicle-types") {
         return Promise.resolve({
           ok: true,
           json: () => Promise.resolve([
             { id: 1, name: "Sedan", active: true },
             { id: 2, name: "Caminhão", active: true },
           ]),
         });
       }
       if (url === "/api/companies") {
         return Promise.resolve({
             ok: true,
             json: () => Promise.resolve([]),
         })
       }
       return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
     }) as any;
  });

  it("should display 'Tipo' column in list view", async () => {
    localStorage.setItem("fleet-view-mode", "list");
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });
    
    await waitFor(() => {
        // Find all elements with text "Tipo" and check if one is a column header
        const tipoElements = screen.getAllByText("Tipo");
        const columnHeader = tipoElements.find(el => el.closest("th"));
        expect(columnHeader).toBeInTheDocument();
    });
    
    await waitFor(() => {
        expect(screen.getByText("Sedan")).toBeInTheDocument();
        expect(screen.getByText("Caminhão")).toBeInTheDocument();
        expect(screen.getByText("Sem Tipo")).toBeInTheDocument();
    });
  });

  it("should allow filtering by vehicle type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });
    
    // Find the filter button (not in table header)
    const buttons = await screen.findAllByRole("button");
    const filterButton = buttons.find(b => b.textContent?.includes("Tipo") && !b.closest("th"));
    
    if (!filterButton) throw new Error("Filter button not found");
    
    await user.click(filterButton);
    
    await waitFor(() => {
        expect(screen.getByText("Sedan")).toBeInTheDocument();
        expect(screen.getByText("Caminhão")).toBeInTheDocument();
    });
    
    const sedanOption = screen.getByText("Sedan");
    await user.click(sedanOption);
    
    await waitFor(() => {
        expect(screen.queryByText(/Model A/)).toBeInTheDocument(); 
        expect(screen.queryByText(/Model B/)).not.toBeInTheDocument();
    });
  });

  it("should allow grouping by vehicle type", async () => {
    const user = userEvent.setup();
    localStorage.setItem("fleet-view-mode", "list"); 
    renderWithProviders(<FleetManagement />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando frota/i)).not.toBeInTheDocument();
    });
    
    const groupButton = screen.getByTitle("Agrupar por Tipo");
    await user.click(groupButton);
    
    await waitFor(() => {
        expect(screen.getByText(/Sedan \(1\)/)).toBeInTheDocument();
        expect(screen.getByText(/Caminhão \(1\)/)).toBeInTheDocument();
    });
    
    const sedanHeader = screen.getByText(/Sedan \(1\)/);
    
    await user.click(sedanHeader); 
    
    await waitFor(() => {
        expect(screen.queryByText(/Model A/)).not.toBeInTheDocument();
    });
    
    await user.click(sedanHeader); 
    
    await waitFor(() => {
        expect(screen.queryByText(/Model A/)).toBeInTheDocument();
    });
  });
});
