import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { useMemo } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { hasAccess, userRole } = usePermissions();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Memoriza o estado de acesso para evitar re-renders desnecessários
  const accessState = useMemo(() => {
    if (authLoading) {
      return 'loading';
    }
    
    if (!user) {
      return 'no-user';
    }
    
    if (!hasAccess(path)) {
      // Redireciona de forma segura
      queueMicrotask(() => {
        if (userRole === 'driver') {
          navigate('/vehicle-checklist');
        } else {
          navigate('/dashboard');
        }
      });
      return 'no-access';
    }
    
    return 'allowed';
  }, [authLoading, user, hasAccess, path, navigate, userRole]);

  // Renderização baseada no estado
  switch (accessState) {
    case 'loading':
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Verificando permissões..." />
        </div>
      );
    
    case 'no-user':
      // Redireciona para login se não há usuário autenticado
      queueMicrotask(() => {
        navigate('/');
      });
      return null;
    
    case 'no-access':
      return null;
    
    case 'allowed':
      return <>{children}</>;
    
    default:
      return null;
  }
}