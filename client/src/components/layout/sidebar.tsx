import { Link, useLocation } from "wouter";
import { 
  Fuel, 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  BarChart3, 
  Settings 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" || path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <Fuel className="mr-2" />
          FuelControl
        </h1>
        <p className="text-sm text-gray-600 mt-1">Sistema de Combustíveis</p>
      </div>
      
      <nav className="mt-6">
        <Link href="/dashboard">
          <a className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}>
            <LayoutDashboard className="mr-3 h-4 w-4" />
            Dashboard
          </a>
        </Link>
        
        <Link href="/requisitions">
          <a className={`sidebar-link ${isActive("/requisitions") ? "active" : ""}`}>
            <ClipboardList className="mr-3 h-4 w-4" />
            Requisições
          </a>
        </Link>
        
        <Link href="/new-requisition">
          <a className={`sidebar-link ${isActive("/new-requisition") ? "active" : ""}`}>
            <Plus className="mr-3 h-4 w-4" />
            Nova Requisição
          </a>
        </Link>
        
        <Link href="/reports">
          <a className={`sidebar-link ${isActive("/reports") ? "active" : ""}`}>
            <BarChart3 className="mr-3 h-4 w-4" />
            Relatórios
          </a>
        </Link>
        
        <Link href="/settings">
          <a className={`sidebar-link ${isActive("/settings") ? "active" : ""}`}>
            <Settings className="mr-3 h-4 w-4" />
            Configurações
          </a>
        </Link>
      </nav>
    </div>
  );
}
