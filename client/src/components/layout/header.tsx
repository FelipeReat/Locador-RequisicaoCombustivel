import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { User as UserType, FuelRequisition } from "@shared/schema";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Buscar dados do usuário atual
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user/profile"],
  });

  // Buscar requisições pendentes para notificações
  const { data: pendingRequisitions } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions/pending"],
    select: (data) => data?.filter(req => req.status === "pending") || [],
  });

  const handleLogout = () => {
    // Limpar sessão e redirecionar para login
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleSettings = () => {
    window.location.href = "/settings";
  };

  const notificationCount = pendingRequisitions?.length || 0;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Notificações ({notificationCount})
                </h3>
                
                {pendingRequisitions && pendingRequisitions.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingRequisitions.map((req) => (
                      <div key={req.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Nova requisição pendente
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {req.quantity}L de {req.fuelType} - {req.justification?.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">
                    Nenhuma notificação no momento
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Dropdown do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.fullName || user?.username || "Usuário"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
