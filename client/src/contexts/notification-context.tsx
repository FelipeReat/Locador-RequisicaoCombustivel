import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  newRequisitions: boolean;
  pendingApprovals: boolean;
  requisitionStatus: boolean;
  monthlyReports: boolean;
}

interface NotificationContextProps {
  settings: NotificationSettings;
  updateSetting: (key: keyof NotificationSettings, value: boolean) => void;
  showNotification: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
}

const defaultSettings: NotificationSettings = {
  newRequisitions: false,
  pendingApprovals: false,
  requisitionStatus: false,
  monthlyReports: false,
};

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const { toast } = useToast();

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
    
    // Show confirmation toast
    toast({
      title: "Configuração Atualizada",
      description: `Notificações ${value ? 'ativadas' : 'desativadas'} com sucesso`,
    });
  };

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast({
      title,
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate different types of notifications
      const notifications = [
        {
          setting: 'newRequisitions' as keyof NotificationSettings,
          title: 'Nova Requisição',
          message: 'Uma nova requisição de combustível foi criada',
        },
        {
          setting: 'pendingApprovals' as keyof NotificationSettings,
          title: 'Aprovação Pendente',
          message: 'Existem requisições aguardando sua aprovação',
        },
        {
          setting: 'requisitionStatus' as keyof NotificationSettings,
          title: 'Status Atualizado',
          message: 'O status da sua requisição foi atualizado',
        },
      ];

      // Randomly show notifications if enabled
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const notification = notifications[Math.floor(Math.random() * notifications.length)];
        if (settings[notification.setting]) {
          showNotification(notification.title, notification.message);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [settings]);

  return (
    <NotificationContext.Provider value={{ settings, updateSetting, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}