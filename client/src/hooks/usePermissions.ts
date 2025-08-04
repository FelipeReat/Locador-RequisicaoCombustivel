import { useAuth } from '@/contexts/auth-context';

// Definição das permissões por função
export type UserRole = 'employee' | 'manager' | 'admin';

export interface Permission {
  path: string;
  label: string;
  icon: string;
  allowedRoles: UserRole[];
}

// Configuração das permissões por página
export const PERMISSIONS: Permission[] = [
  {
    path: '/dashboard',
    label: 'dashboard',
    icon: 'LayoutDashboard',
    allowedRoles: ['employee', 'manager', 'admin'], // Todos têm acesso ao painel
  },
  {
    path: '/requisitions',
    label: 'requisitions',
    icon: 'ClipboardList',
    allowedRoles: ['employee', 'manager', 'admin'], // Todos têm acesso às requisições
  },
  {
    path: '/new-requisition',
    label: 'new-requisition',
    icon: 'Plus',
    allowedRoles: ['employee', 'manager', 'admin'], // Todos podem criar requisições
  },
  {
    path: '/reports',
    label: 'reports',
    icon: 'BarChart3',
    allowedRoles: ['manager', 'admin'], // Apenas gerentes e admins têm acesso aos relatórios
  },
  {
    path: '/user-management',
    label: 'users',
    icon: 'Users',
    allowedRoles: ['manager', 'admin'], // Gerentes visualizam equipe, admins gerenciam todos
  },
  {
    path: '/fleet-management',
    label: 'fleet',
    icon: 'Car',
    allowedRoles: ['manager', 'admin'], // Gerentes consultam frota, admins gerenciam
  },
  {
    path: '/suppliers',
    label: 'suppliers',
    icon: 'Building2',
    allowedRoles: ['admin'], // Apenas admins gerenciam fornecedores
  },
  {
    path: '/companies',
    label: 'companies',
    icon: 'Building',
    allowedRoles: ['admin'], // Apenas admins gerenciam empresas
  },
  {
    path: '/settings',
    label: 'settings',
    icon: 'Settings',
    allowedRoles: ['employee', 'manager', 'admin'], // Todos têm acesso às configurações
  },
];

export function usePermissions() {
  const { user } = useAuth();
  
  // Determina a função do usuário
  const getUserRole = (): UserRole => {
    if (!user?.role) return 'employee';
    
    // Mapeamento dos papéis do banco para os tipos do sistema
    switch (user.role) {
      case 'admin':
        return 'admin';
      case 'manager':
        return 'manager';
      case 'employee':
      default:
        return 'employee';
    }
  };

  const userRole = getUserRole();

  // Retorna as páginas permitidas para o usuário atual
  const getAllowedPages = (): Permission[] => {
    return PERMISSIONS.filter(permission => 
      permission.allowedRoles.includes(userRole)
    );
  };

  // Verifica se o usuário tem acesso a uma página específica
  const hasAccess = (path: string): boolean => {
    const permission = PERMISSIONS.find(p => p.path === path);
    if (!permission) return false;
    return permission.allowedRoles.includes(userRole);
  };

  // Verifica se o usuário pode executar ações específicas
  const canEdit = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  const canDelete = (): boolean => {
    return userRole === 'admin';
  };

  const canApprove = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  const canViewAllRequisitions = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  const canManageUsers = (): boolean => {
    return userRole === 'admin';
  };

  const canManageFleet = (): boolean => {
    return userRole === 'admin';
  };

  const canViewTeamData = (): boolean => {
    return userRole === 'manager' || userRole === 'admin';
  };

  return {
    userRole,
    allowedPages: getAllowedPages(),
    hasAccess,
    canEdit,
    canDelete,
    canApprove,
    canViewAllRequisitions,
    canManageUsers,
    canManageFleet,
    canViewTeamData,
  };
}