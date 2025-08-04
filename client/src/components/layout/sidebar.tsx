import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
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

// Mapeamento dos ícones para renderização dinâmica
const iconMap = {
  LayoutDashboard,
  ClipboardList,
  Plus,
  BarChart3,
  Users,
  Car,
  Building2,
  Building,
  Settings,
};

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { allowedPages, userRole } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/" || path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  // Função para obter o ícone correto
  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="mr-3 h-4 w-4" /> : <Settings className="mr-3 h-4 w-4" />;
  };

  // Função para obter o rótulo da função do usuário
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'employee':
      default:
        return 'Funcionário';
    }
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
        {allowedPages.map((page) => (
          <Link key={page.path} href={page.path}>
            <div className={`sidebar-link ${isActive(page.path) ? "active" : ""}`}>
              {getIcon(page.icon)}
              {t(page.label)}
            </div>
          </Link>
        ))}
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
              {getRoleLabel(user?.role || 'employee')}
            </p>
          </div>
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