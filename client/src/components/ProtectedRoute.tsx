import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { useEffect, useMemo } from 'react';
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
      return 'no-access';
    }
    
    return 'allowed';
  }, [authLoading, user, hasAccess, path]);

  useEffect(() => {
    if (accessState === 'no-user') {
      navigate('/');
      return;
    }

    if (accessState === 'no-access') {
      if (userRole === 'driver') {
        navigate('/vehicle-checklist');
      } else {
        navigate('/dashboard');
      }
    }
  }, [accessState, navigate, userRole]);

  // Renderização baseada no estado
  switch (accessState) {
    case 'loading':
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Verificando permissões..." />
        </div>
      );
    
    case 'no-user':
      return null;
    
    case 'no-access':
      return null;
    
    case 'allowed':
      return <>{children}</>;
    
    default:
      return null;
  }
}
