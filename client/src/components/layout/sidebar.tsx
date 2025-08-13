import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  Fuel, 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  BarChart3, 
  Calculator,
  Settings,
  Users,
  Car,
  Building2, 
  Building,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";

// Mapeamento dos ícones para renderização dinâmica
const iconMap = {
  LayoutDashboard,
  ClipboardList,
  Plus,
  BarChart3,
  Calculator,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    // Use requestAnimationFrame para garantir que as mudanças no DOM sejam aplicadas de forma segura
    const updateBodyClass = () => {
      if (isMobileMenuOpen) {
        document.body.classList.add('mobile-menu-open');
      } else {
        document.body.classList.remove('mobile-menu-open');
      }
    };

    requestAnimationFrame(updateBodyClass);

    // Cleanup on unmount
    return () => {
      requestAnimationFrame(() => {
        document.body.classList.remove('mobile-menu-open');
      });
    };
  }, [isMobileMenuOpen]);

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
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-2 left-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white dark:bg-gray-800 shadow-lg border-gray-300 dark:border-gray-600 h-10 w-10 p-0 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:static
        inset-y-0 left-0
        z-50 lg:z-auto
        w-64 bg-white dark:bg-gray-800 shadow-lg
        transition-transform duration-300 ease-in-out
        lg:transition-none
        flex flex-col
        overflow-hidden
      `}>
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg lg:text-xl font-bold text-primary flex items-center justify-center">
            <Fuel className="mr-2 h-5 w-5 lg:h-6 lg:w-6" />
            <span className="hidden sm:block">{t('system-name')}</span>
          </h1>
        </div>

        <nav className="mt-4 lg:mt-6 flex-1 overflow-y-auto">
        {allowedPages.map((page) => (
          <Link key={page.path} href={page.path}>
            <div 
              className={`sidebar-link ${isActive(page.path) ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {getIcon(page.icon)}
              {t(page.label)}
            </div>
          </Link>
        ))}
      </nav>

      <div className="flex-shrink-0 mobile-sidebar-content border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {getRoleLabel(user?.role || 'employee')}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setIsMobileMenuOpen(false);
            logout();
          }}
          variant="outline" 
          size="sm" 
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 h-10 sm:h-11"
        >
          <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Sair do sistema</span>
        </Button>
      </div>
    </div>
    </>
  );
}