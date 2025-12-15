
import { useEffect } from 'react';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

interface InactivityWrapperProps {
  children: React.ReactNode;
}

export default function InactivityWrapper({ children }: InactivityWrapperProps) {
  const { logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleInactivityTimeout = () => {
    toast({
      title: t('session-expired') || 'Sessão Expirada',
      description: t('session-expired-message') || 'Sua sessão expirou devido à inatividade. Faça login novamente.',
      variant: 'destructive',
      duration: 5000,
    });
    logout();
  };

  const { pauseTimeout, resumeTimeout } = useInactivityTimeout({
    timeout: 5 * 60 * 1000, // 5 minutos
    onTimeout: handleInactivityTimeout,
  });

  useEffect(() => {
    // Pausar timeout durante operações críticas (pode ser expandido conforme necessário)
    const handleBeforeUnload = () => {
      pauseTimeout();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pauseTimeout]);

  return <>{children}</>;
}
