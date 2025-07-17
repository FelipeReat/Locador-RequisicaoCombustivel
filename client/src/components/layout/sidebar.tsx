import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { 
  Fuel, 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  BarChart3, 
  Settings,
  Users,
  Building,
  Car
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === "/" || path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <Fuel className="mr-2" />
          FuelControl
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('fuel-control-system')}</p>
      </div>

      <nav className="mt-6">
        <Link href="/dashboard">
          <div className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}>
            <LayoutDashboard className="mr-3 h-4 w-4" />
            {t('dashboard')}
          </div>
        </Link>

        <Link href="/requisitions">
          <div className={`sidebar-link ${isActive("/requisitions") ? "active" : ""}`}>
            <ClipboardList className="mr-3 h-4 w-4" />
            {t('requisitions')}
          </div>
        </Link>

        <Link href="/new-requisition">
          <div className={`sidebar-link ${isActive("/new-requisition") ? "active" : ""}`}>
            <Plus className="mr-3 h-4 w-4" />
            {t('new-requisition')}
          </div>
        </Link>

        <Link href="/reports">
          <div className={`sidebar-link ${isActive("/reports") ? "active" : ""}`}>
            <BarChart3 className="mr-3 h-4 w-4" />
            {t('reports')}
          </div>
        </Link>

        <Link href="/user-management">
          <div className={`sidebar-link ${isActive("/user-management") ? "active" : ""}`}>
            <Users className="mr-3 h-4 w-4" />
            Usuários
          </div>
        </Link>

        <Link href="/department-management">
          <div className={`sidebar-link ${isActive("/department-management") ? "active" : ""}`}>
            <Building className="mr-3 h-4 w-4" />
            Departamentos
          </div>
        </Link>

        <Link href="/fleet-management">
          <div className={`sidebar-link ${isActive("/fleet-management") ? "active" : ""}`}>
            <Car className="mr-3 h-4 w-4" />
            Frota
          </div>
        </Link>

        <Link href="/settings">
          <div className={`sidebar-link ${isActive("/settings") ? "active" : ""}`}>
            <Settings className="mr-3 h-4 w-4" />
            {t('settings')}
          </div>
        </Link>
      </nav>
    </div>
  );
}