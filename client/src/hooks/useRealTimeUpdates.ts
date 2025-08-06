import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook para gerenciar atualizações em tempo real
 * Força a revalidação de queries críticas em intervalos regulares
 */
export function useRealTimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Queries críticas que precisam de atualização frequente
    const criticalQueries = [
      '/api/fuel-requisitions',
      '/api/fuel-requisitions/stats/overview',
      '/api/vehicles',
      '/api/dashboard'
    ];

    // Função para revalidar queries críticas
    const revalidateCriticalData = () => {
      criticalQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };

    // Revalida quando a aba ganha foco
    const handleFocus = () => {
      revalidateCriticalData();
    };

    // Revalida quando volta de estar offline
    const handleOnline = () => {
      revalidateCriticalData();
    };

    // Event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient]);

  // Função para forçar atualização manual
  const forceRefresh = () => {
    queryClient.invalidateQueries();
  };

  return { forceRefresh };
}

/**
 * Hook para atualizações otimistas em mutações
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const updateOptimistically = <T>(
    queryKey: string[],
    updater: (oldData: T | undefined) => T | undefined
  ) => {
    queryClient.setQueryData(queryKey, updater);
  };

  const rollback = <T>(queryKey: string[], previousData: T) => {
    queryClient.setQueryData(queryKey, previousData);
  };

  return { updateOptimistically, rollback };
}

/**
 * Hook para invalidação inteligente de cache
 * Invalida queries relacionadas baseado no tipo de operação
 */
export function useSmartInvalidation() {
  const queryClient = useQueryClient();

  const invalidateByOperation = (operation: 'requisition' | 'vehicle' | 'user' | 'supplier' | 'company') => {
    const invalidationMap = {
      requisition: [
        '/api/fuel-requisitions',
        '/api/fuel-requisitions/stats',
        '/api/dashboard'
      ],
      vehicle: [
        '/api/vehicles',
        '/api/fuel-requisitions',
        '/api/dashboard'
      ],
      user: [
        '/api/users',
        '/api/fuel-requisitions',
        '/api/dashboard'
      ],
      supplier: [
        '/api/suppliers',
        '/api/fuel-requisitions'
      ],
      company: [
        '/api/companies',
        '/api/fuel-requisitions',
        '/api/users'
      ]
    };

    const queriesToInvalidate = invalidationMap[operation] || [];
    
    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  };

  return { invalidateByOperation };
}