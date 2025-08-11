import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { hasAccess } = usePermissions();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  useEffect(() => {
    // Só verifica acesso depois que a autenticação estiver completa
    if (!authLoading) {
      if (user && !hasAccess(path)) {
        // Usa setTimeout para evitar mudanças de estado durante a renderização
        setTimeout(() => {
          navigate('/dashboard');
        }, 0);
      } else {
        setHasCheckedAccess(true);
      }
    }
  }, [path, hasAccess, navigate, authLoading, user]);

  // Mostra loading enquanto carrega autenticação ou enquanto não verificou acesso
  if (authLoading || !hasCheckedAccess) {
    return <LoadingSpinner message="Verificando permissões..." />;
  }

  // Se não tem acesso, não renderiza nada (redirecionamento já foi feito)
  if (!hasAccess(path)) {
    return null;
  }

  return <>{children}</>;
}