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
  ClipboardCheck,
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
  X,
  ShieldCheck,
} from "lucide-react";

// Mapeamento dos ícones para renderização dinâmica
const iconMap = {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
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
      case 'driver':
        return 'Motorista';
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
          className="h-10 w-10 rounded-xl border-zinc-300 bg-white/95 p-0 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
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
        w-72 border-r border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-zinc-900 to-stone-950 text-white shadow-2xl
        transition-transform duration-300 ease-in-out
        lg:transition-none
        flex flex-col
        overflow-hidden
      `}>
        <div className="border-b border-white/10 p-4 lg:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-900/20">
              <Fuel className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-200/80">
                Controle de
              </p>
              <h1 className="text-base font-semibold leading-tight text-white">
                Abastecimento
              </h1>
            </div>
          </div>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 lg:mt-6">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
          Navegação
        </div>
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

      <div className="flex-shrink-0 border-t border-white/10 p-3 sm:p-4 lg:p-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 shadow-md">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.fullName || user?.username}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-zinc-300">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                <span className="truncate">{getRoleLabel(user?.role || 'employee')}</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            variant="outline" 
            size="sm" 
            className="h-11 w-full justify-start border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15 hover:text-red-100"
          >
            <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Sair do sistema</span>
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
