import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { NotificationsPopover } from "@/components/notifications-popover";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import type { User as UserType } from "@shared/schema";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleProfileSettings = () => {
    navigate("/settings");
  };

  const handleChangePassword = () => {
    navigate("/settings?tab=security");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mobile-container py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 lg:flex-none">
          <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white truncate">{title}</h2>
          {subtitle && <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-1 lg:space-x-4 ml-2 lg:ml-4">
          <SyncIndicator />
          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="lg:flex lg:items-center lg:space-x-2 h-auto p-1 lg:p-2">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                </div>
                <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.fullName || user?.username || "Usuário"}
                </span>
                <ChevronDown className="hidden lg:inline h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.fullName || user?.username || "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleProfileSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações do Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleChangePassword}>
                <User className="mr-2 h-4 w-4" />
                <span>Alterar Senha</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}