import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  'pt-BR': {
    'dashboard': 'Painel',
    'requisitions': 'Requisições',
    'new-requisition': 'Nova Requisição',
    'reports': 'Relatórios',
    'settings': 'Configurações',
    'profile': 'Perfil',
    'security': 'Segurança',
    'notifications': 'Notificações',
    'system': 'Sistema',
    'save': 'Salvar',
    'cancel': 'Cancelar',
    'loading': 'Carregando...',
    'success': 'Sucesso',
    'error': 'Erro',
    'fuel-control-system': 'Sistema de Controle de Combustível',
    'total-requests': 'Total de Requisições',
    'pending-requests': 'Requisições Pendentes',
    'approved-requests': 'Requisições Aprovadas',
    'fuel-consumption': 'Consumo de Combustível',
    'change-password': 'Alterar Senha',
    'current-password': 'Senha Atual',
    'new-password': 'Nova Senha',
    'confirm-password': 'Confirmar Senha',
    'theme': 'Tema',
    'language': 'Idioma',
    'dark': 'Escuro',
    'light': 'Claro',
    'system-theme': 'Sistema',
    'notification-settings': 'Configurações de Notificação',
    'new-requisitions': 'Novas Requisições',
    'pending-approvals': 'Aprovações Pendentes',
    'requisition-status': 'Status de Requisições',
    'monthly-reports': 'Relatórios Mensais',
    'enabled': 'Ativado',
    'disabled': 'Desativado',
  },
  'en-US': {
    'dashboard': 'Dashboard',
    'requisitions': 'Requisitions',
    'new-requisition': 'New Requisition',
    'reports': 'Reports',
    'settings': 'Settings',
    'profile': 'Profile',
    'security': 'Security',
    'notifications': 'Notifications',
    'system': 'System',
    'save': 'Save',
    'cancel': 'Cancel',
    'loading': 'Loading...',
    'success': 'Success',
    'error': 'Error',
    'fuel-control-system': 'Fuel Control System',
    'total-requests': 'Total Requests',
    'pending-requests': 'Pending Requests',
    'approved-requests': 'Approved Requests',
    'fuel-consumption': 'Fuel Consumption',
    'change-password': 'Change Password',
    'current-password': 'Current Password',
    'new-password': 'New Password',
    'confirm-password': 'Confirm Password',
    'theme': 'Theme',
    'language': 'Language',
    'dark': 'Dark',
    'light': 'Light',
    'system-theme': 'System',
    'notification-settings': 'Notification Settings',
    'new-requisitions': 'New Requisitions',
    'pending-approvals': 'Pending Approvals',
    'requisition-status': 'Requisition Status',
    'monthly-reports': 'Monthly Reports',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
  },
  'es-ES': {
    'dashboard': 'Tablero',
    'requisitions': 'Requisiciones',
    'new-requisition': 'Nueva Requisición',
    'reports': 'Informes',
    'settings': 'Configuraciones',
    'profile': 'Perfil',
    'security': 'Seguridad',
    'notifications': 'Notificaciones',
    'system': 'Sistema',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'loading': 'Cargando...',
    'success': 'Éxito',
    'error': 'Error',
    'fuel-control-system': 'Sistema de Control de Combustible',
    'total-requests': 'Total de Requisiciones',
    'pending-requests': 'Requisiciones Pendientes',
    'approved-requests': 'Requisiciones Aprobadas',
    'fuel-consumption': 'Consumo de Combustible',
    'change-password': 'Cambiar Contraseña',
    'current-password': 'Contraseña Actual',
    'new-password': 'Nueva Contraseña',
    'confirm-password': 'Confirmar Contraseña',
    'theme': 'Tema',
    'language': 'Idioma',
    'dark': 'Oscuro',
    'light': 'Claro',
    'system-theme': 'Sistema',
    'notification-settings': 'Configuraciones de Notificación',
    'new-requisitions': 'Nuevas Requisiciones',
    'pending-approvals': 'Aprobaciones Pendientes',
    'requisition-status': 'Estado de Requisiciones',
    'monthly-reports': 'Informes Mensuales',
    'enabled': 'Activado',
    'disabled': 'Desactivado',
  },
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt-BR';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}