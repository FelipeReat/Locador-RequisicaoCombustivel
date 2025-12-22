import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemSettings {
  itemsPerPage: number;
  dateFormat: string;
  theme: string;
  language: string;
  startScreen: string;
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  itemsPerPage: 20,
  dateFormat: 'DD/MM/YYYY',
  theme: 'system',
  language: 'pt-BR',
  startScreen: '/dashboard',
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export function SystemSettingsProvider({ children }: SystemSettingsProviderProps) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('system-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do sistema:', error);
      }
    };

    loadSettings();
  }, []);

  // Salvar configurações no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem('system-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('system-settings');
  };

  return (
    <SystemSettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings deve ser usado dentro de um SystemSettingsProvider');
  }
  return context;
}