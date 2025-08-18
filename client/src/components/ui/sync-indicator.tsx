import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'error';

export function SyncIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Monitora status de conexão
    const handleOnline = () => setSyncStatus('online');
    const handleOffline = () => setSyncStatus('offline');

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Verifica status inicial
      setSyncStatus(navigator.onLine ? 'online' : 'offline');

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Monitora queries em execução
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Usar requestAnimationFrame para evitar setState durante render
      requestAnimationFrame(() => {
        if (event?.query?.state.fetchStatus === 'fetching') {
          setSyncStatus('syncing');
        } else if (event?.query?.state.fetchStatus === 'idle') {
          setSyncStatus('synced');
          setLastSync(new Date());
          // Volta para 'online' após 2 segundos
          setTimeout(() => setSyncStatus('online'), 2000);
        }
      });
    });

    return unsubscribe;
  }, [queryClient]);

  const handleManualSync = () => {
    setSyncStatus('syncing');
    queryClient.invalidateQueries();
    toast({
      title: "Sincronização",
      description: "Atualizando dados...",
    });
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'offline':
        return 'Offline';
      case 'syncing':
        return 'Sincronizando...';
      case 'synced':
        return 'Sincronizado';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Online';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'offline':
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'syncing':
        return 'text-blue-600 dark:text-blue-400';
      case 'synced':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className={cn('font-medium', getStatusColor())}>
          {getStatusText()}
        </span>
      </div>

      {syncStatus !== 'syncing' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          className="h-6 px-2 text-xs"
          title="Atualizar dados manualmente"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}

      {lastSync && syncStatus !== 'offline' && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastSync.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
}