import { usePermissions } from '@/hooks/usePermissions';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { hasAccess } = usePermissions();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!hasAccess(path)) {
      // Redireciona para o dashboard se não tiver acesso
      navigate('/dashboard');
    }
  }, [path, hasAccess, navigate]);

  // Se não tem acesso, não renderiza nada (redirecionamento já foi feito)
  if (!hasAccess(path)) {
    return null;
  }

  return <>{children}</>;
}