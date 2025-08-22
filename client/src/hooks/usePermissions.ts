import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';

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
    path: '/fuel-tracking',
    label: 'fuel-tracking',
    icon: 'Calculator',
    allowedRoles: ['admin'], // Apenas admins podem usar o controle de combustível
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

  const canApprove = useMemo(() => {
    return userRole === 'admin' || userRole === 'manager';
  }, [userRole]);

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

  // Alias para compatibilidade com componentes existentes
  const hasPermission = (action: string): boolean => {
    switch (action) {
      case 'create_fuel_requisition':
        return hasAccess('/new-requisition');
      case 'read_fuel_requisition':
        return hasAccess('/requisitions');
      case 'read_vehicle':
        return hasAccess('/fleet-management');
      case 'read_supplier':
        return hasAccess('/suppliers');
      case 'read_company':
        return hasAccess('/companies');
      case 'read_user':
        return hasAccess('/user-management');
      case 'view_reports':
        return hasAccess('/reports');
      default:
        return false;
    }
  };

  const canAccessRequisition = (requesterId: number): boolean => {
    // Todos podem ver requisições, mas só podem agir nas próprias (para funcionários)
    return true;
  };

  const canActOnRequisition = (requesterId: number) => {
    if (userRole === 'admin' || userRole === 'manager') {
      return true;
    }
    if (userRole === 'employee') {
      return user?.id === requesterId;
    }
    return false;
  };

  return {
    userRole,
    allowedPages: getAllowedPages(),
    hasAccess,
    hasPermission, // Adicionando função para compatibilidade
    canEdit,
    canDelete,
    canApprove,
    canViewAllRequisitions,
    canManageUsers,
    canManageFleet,
    canViewTeamData,
    canAccessRequisition,
    canActOnRequisition,
  };
}