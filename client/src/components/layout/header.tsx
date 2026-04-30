import { User, Settings, LogOut, ChevronDown, Sun, Moon, Sparkles } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { actualTheme, setTheme } = useTheme();

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
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-background/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <div className="mobile-header">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/90 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 ml-14 sm:ml-12 lg:ml-0">
              <div className="mb-1 flex items-center gap-2">
                <div className="hidden sm:flex h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Painel Atual
                </div>
              </div>
              <h1 className="mobile-text-lg font-bold text-zinc-800 dark:text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mobile-text-sm mt-1 hidden truncate text-zinc-600 dark:text-zinc-300 sm:block">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1 lg:space-x-3 ml-2 lg:ml-4">
              <div className="hidden md:block rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <SyncIndicator />
              </div>
              <div className="md:hidden">
                <SyncIndicator />
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl p-0 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label={actualTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
              >
                {actualTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <NotificationsPopover />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto rounded-2xl border border-zinc-200 bg-zinc-50 px-2 py-1.5 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 lg:flex lg:items-center lg:space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="max-w-[180px] truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {user?.fullName || user?.username || "Usuário"}
                      </div>
                    </div>
                    <ChevronDown className="hidden lg:inline h-4 w-4 text-zinc-500" />
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
        </div>
      </div>
    </header>
  );
}
