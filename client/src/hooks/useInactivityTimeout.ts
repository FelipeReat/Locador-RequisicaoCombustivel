
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UseInactivityTimeoutOptions {
  timeout?: number; // em millisegundos
  onTimeout?: () => void;
  events?: string[];
}

export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
  const { logout, isAuthenticated } = useAuth();
  const {
    timeout = 5 * 60 * 1000, // 5 minutos em millisegundos
    onTimeout,
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  } = options;

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const isActive = useRef(true);

  const handleTimeout = useCallback(() => {
    if (isAuthenticated && isActive.current) {
      console.log('Usuário inativo por 5 minutos, fazendo logout automático...');
      if (onTimeout) {
        onTimeout();
      }
      logout();
    }
  }, [isAuthenticated, logout, onTimeout]);

  const resetTimeout = useCallback(() => {
    if (!isAuthenticated) return;

    // Limpar timeout anterior
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    // Criar novo timeout
    timeoutId.current = setTimeout(handleTimeout, timeout);
  }, [handleTimeout, timeout, isAuthenticated]);

  const handleActivity = useCallback(() => {
    if (!isAuthenticated) return;
    resetTimeout();
  }, [resetTimeout, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Limpar timeout se usuário não estiver autenticado
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
      return;
    }

    // Iniciar timeout quando usuário estiver autenticado
    resetTimeout();

    // Adicionar event listeners para atividade do usuário
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Listener para quando a janela ganha foco
    const handleFocus = () => {
      isActive.current = true;
      resetTimeout();
    };

    // Listener para quando a janela perde foco
    const handleBlur = () => {
      isActive.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isAuthenticated, events, handleActivity, resetTimeout]);

  // Função para pausar o timeout (útil em modais ou operações críticas)
  const pauseTimeout = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  // Função para retomar o timeout
  const resumeTimeout = useCallback(() => {
    if (isAuthenticated) {
      resetTimeout();
    }
  }, [isAuthenticated, resetTimeout]);

  return {
    pauseTimeout,
    resumeTimeout,
    resetTimeout: handleActivity
  };
}
