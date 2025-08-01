import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Fuel, 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  BarChart3, 
  Settings,
  Users,
  Car,
  Building2, 
  Building,
  LogOut,
  User
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" || path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg relative">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary flex items-center justify-center">
          <Fuel className="mr-2" />
          {t('system-name')}
        </h1>
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
            {t('users')}
          </div>
        </Link>

        <Link href="/fleet-management">
          <div className={`sidebar-link ${isActive("/fleet-management") ? "active" : ""}`}>
            <Car className="mr-3 h-4 w-4" />
            {t('fleet')}
          </div>
        </Link>

        <Link href="/suppliers">
          <div className={`sidebar-link ${isActive("/suppliers") ? "active" : ""}`}>
            <Building2 className="mr-3 h-4 w-4" />
            {t('suppliers')}
          </div>
        </Link>

        <Link href="/companies">
          <div className={`sidebar-link ${isActive("/companies") ? "active" : ""}`}>
            <Building className="mr-3 h-4 w-4" />
            {t('companies')}
          </div>
        </Link>

        <Link href="/settings">
          <div className={`sidebar-link ${isActive("/settings") ? "active" : ""}`}>
            <Settings className="mr-3 h-4 w-4" />
            {t('settings')}
          </div>
        </Link>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role === 'admin' ? 'Administrador' : (user as any)?.position || 'Funcionário'}
            </p>
          </div>
          <Button 
            onClick={logout} 
            variant="ghost" 
            size="sm" 
            className="p-1 h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Sair do sistema"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
        <Button 
          onClick={logout} 
          variant="outline" 
          size="sm" 
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair do sistema
        </Button>
      </div>
    </div>
  );
}