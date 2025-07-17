
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  'pt-BR': {
    // Navegação
    'dashboard': 'Painel',
    'requisitions': 'Requisições',
    'new-requisition': 'Nova Requisição',
    'reports': 'Relatórios',
    'settings': 'Configurações',
    
    // Ações
    'save': 'Salvar',
    'cancel': 'Cancelar',
    'edit': 'Editar',
    'delete': 'Excluir',
    'view': 'Visualizar',
    'print': 'Imprimir',
    'export': 'Exportar',
    'import': 'Importar',
    'search': 'Buscar',
    'filter': 'Filtrar',
    'clear': 'Limpar',
    'submit': 'Enviar',
    'close': 'Fechar',
    'open': 'Abrir',
    'add': 'Adicionar',
    'remove': 'Remover',
    'update': 'Atualizar',
    'create': 'Criar',
    'confirm': 'Confirmar',
    'approve': 'Aprovar',
    'reject': 'Rejeitar',
    
    // Estados
    'loading': 'Carregando...',
    'success': 'Sucesso',
    'error': 'Erro',
    'warning': 'Aviso',
    'info': 'Informação',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'fulfilled': 'Realizado',
    'cancelled': 'Cancelado',
    
    // Sistema
    'fuel-control-system': 'Sistema de Controle de Combustível',
    'profile': 'Perfil',
    'security': 'Segurança',
    'notifications': 'Notificações',
    'system': 'Sistema',
    'theme': 'Tema',
    'language': 'Idioma',
    'dark': 'Escuro',
    'light': 'Claro',
    'system-theme': 'Sistema',
    'enabled': 'Ativado',
    'disabled': 'Desativado',
    
    // Dashboard
    'total-requests': 'Total de Requisições',
    'pending-requests': 'Requisições Pendentes',
    'approved-requests': 'Requisições Aprovadas',
    'fuel-consumption': 'Consumo de Combustível',
    'monthly-consumption': 'Consumo Mensal',
    'weekly-consumption': 'Consumo Semanal',
    'consumption-by-department': 'Consumo por Departamento',
    'consumption-by-fuel-type': 'Consumo por Tipo de Combustível',
    'recent-activity': 'Atividade Recente',
    'quick-stats': 'Estatísticas Rápidas',
    
    // Requisições
    'requisition': 'Requisição',
    'requisition-number': 'Número da Requisição',
    'requisition-date': 'Data da Requisição',
    'requester': 'Solicitante',
    'department': 'Departamento',
    'fuel-type': 'Tipo de Combustível',
    'quantity': 'Quantidade',
    'priority': 'Prioridade',
    'status': 'Status',
    'justification': 'Justificativa',
    'approver': 'Aprovador',
    'approval-date': 'Data de Aprovação',
    'needed-date': 'Data Necessária',
    'request-date': 'Data de Solicitação',
    'details': 'Detalhes',
    'actions': 'Ações',
    
    // Tipos de combustível
    'gasoline': 'Gasolina',
    'ethanol': 'Etanol',
    'diesel': 'Diesel',
    'diesel-s10': 'Diesel S10',
    
    // Departamentos
    'logistics': 'Logística',
    'maintenance': 'Manutenção',
    'administration': 'Administração',
    'operations': 'Operações',
    'transport': 'Transporte',
    
    // Prioridades
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente',
    
    // Formulários
    'required-field': 'Campo obrigatório',
    'select-option': 'Selecione uma opção',
    'enter-value': 'Digite um valor',
    'invalid-email': 'E-mail inválido',
    'password-too-short': 'Senha muito curta',
    'passwords-dont-match': 'Senhas não coincidem',
    'form-errors': 'Corrija os erros no formulário',
    'form-saved': 'Formulário salvo com sucesso',
    
    // Relatórios
    'generate-report': 'Gerar Relatório',
    'report-period': 'Período do Relatório',
    'start-date': 'Data Inicial',
    'end-date': 'Data Final',
    'report-type': 'Tipo de Relatório',
    'consumption-report': 'Relatório de Consumo',
    'requisitions-report': 'Relatório de Requisições',
    'department-report': 'Relatório por Departamento',
    'fuel-type-report': 'Relatório por Tipo de Combustível',
    'monthly-reports': 'Relatórios Mensais',
    'weekly-reports': 'Relatórios Semanais',
    'annual-reports': 'Relatórios Anuais',
    
    // Configurações
    'general-settings': 'Configurações Gerais',
    'user-preferences': 'Preferências do Usuário',
    'system-settings': 'Configurações do Sistema',
    'notification-settings': 'Configurações de Notificação',
    'change-password': 'Alterar Senha',
    'current-password': 'Senha Atual',
    'new-password': 'Nova Senha',
    'confirm-password': 'Confirmar Senha',
    'new-requisitions': 'Novas Requisições',
    'pending-approvals': 'Aprovações Pendentes',
    'requisition-status': 'Status de Requisições',
    'personal-info': 'Informações Pessoais',
    'contact-info': 'Informações de Contato',
    
    // Usuário
    'username': 'Nome de usuário',
    'full-name': 'Nome completo',
    'email': 'E-mail',
    'phone': 'Telefone',
    'position': 'Cargo',
    'role': 'Função',
    'last-login': 'Último acesso',
    'account-created': 'Conta criada',
    
    // Mensagens
    'no-data': 'Nenhum dado encontrado',
    'no-results': 'Nenhum resultado encontrado',
    'loading-data': 'Carregando dados...',
    'save-success': 'Salvo com sucesso',
    'delete-success': 'Excluído com sucesso',
    'update-success': 'Atualizado com sucesso',
    'operation-failed': 'Operação falhou',
    'confirm-delete': 'Tem certeza que deseja excluir?',
    'confirm-action': 'Tem certeza que deseja continuar?',
    'unsaved-changes': 'Há alterações não salvas',
    
    // Paginação
    'page': 'Página',
    'of': 'de',
    'items-per-page': 'Itens por página',
    'total-items': 'Total de itens',
    'previous': 'Anterior',
    'next': 'Próximo',
    'first': 'Primeiro',
    'last': 'Último',
    
    // Data e hora
    'today': 'Hoje',
    'yesterday': 'Ontem',
    'this-week': 'Esta semana',
    'last-week': 'Semana passada',
    'this-month': 'Este mês',
    'last-month': 'Mês passado',
    'this-year': 'Este ano',
    'date-format': 'DD/MM/AAAA',
    'time-format': 'HH:mm',
    
    // Impressão
    'print-document': 'Imprimir Documento',
    'print-preview': 'Visualizar Impressão',
    'print-options': 'Opções de Impressão',
    
    // Sobre
    'version': 'Versão',
    'last-update': 'Última Atualização',
    'developed-by': 'Desenvolvido por',
    'about-system': 'Sobre o Sistema',
    'system-info': 'Informações do Sistema',
    
    // Traduções adicionais
    'filters': 'Filtros',
    'search-requisitions': 'Buscar requisições...',
    'filter-by-status': 'Filtrar por status',
    'filter-by-department': 'Filtrar por departamento',
    'all-statuses': 'Todos os status',
    'all-departments': 'Todos os departamentos',
    'clear-filters': 'Limpar Filtros',
    'no-results-with-filters': 'Nenhuma requisição encontrada com os filtros aplicados',
    'manage-all-fuel-requisitions': 'Gerenciar todas as requisições de combustível',
    'consumed-liters': 'Litros Consumidos',
    'quick-actions': 'Ações Rápidas',
    'approve-pending': 'Aprovar Pendentes',
    'recent-requisitions': 'Requisições Recentes',
    'view-all': 'Ver todas',
    'fuel-requisitions-overview': 'Visão geral das requisições de combustível',
    'loading-dashboard': 'Carregando dashboard...',
    'loading-reports': 'Carregando relatórios...',
    'create-new-fuel-requisition': 'Criar uma nova requisição de combustível',
    'requisition-form': 'Formulário de Requisição',
    'fill-required-data': 'Preencha os dados necessários para criar uma nova requisição de combustível',
    'fuel-consumption-analysis': 'Análise e estatísticas de consumo de combustível',
    'date': 'Data',
    'enter-full-name': 'Seu nome completo',
    'enter-email': 'seu@email.com',
    'select-department': 'Selecione um departamento',
    'enter-phone': '(11) 99999-9999',
    'enter-position': 'Seu cargo na empresa',
    'save-changes': 'Salvar Alterações',
    'account-info': 'Informações da Conta',
    'account-details': 'Detalhes sobre sua conta no sistema',
    'last-updated': 'Última Atualização',
    'manage-profile-preferences': 'Gerencie seu perfil e preferências do sistema',
  },
  'en-US': {
    // Navigation
    'dashboard': 'Dashboard',
    'requisitions': 'Requisitions',
    'new-requisition': 'New Requisition',
    'reports': 'Reports',
    'settings': 'Settings',
    
    // Actions
    'save': 'Save',
    'cancel': 'Cancel',
    'edit': 'Edit',
    'delete': 'Delete',
    'view': 'View',
    'print': 'Print',
    'export': 'Export',
    'import': 'Import',
    'search': 'Search',
    'filter': 'Filter',
    'clear': 'Clear',
    'submit': 'Submit',
    'close': 'Close',
    'open': 'Open',
    'add': 'Add',
    'remove': 'Remove',
    'update': 'Update',
    'create': 'Create',
    'confirm': 'Confirm',
    'approve': 'Approve',
    'reject': 'Reject',
    
    // States
    'loading': 'Loading...',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    'info': 'Information',
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'fulfilled': 'Fulfilled',
    'cancelled': 'Cancelled',
    
    // System
    'fuel-control-system': 'Fuel Control System',
    'profile': 'Profile',
    'security': 'Security',
    'notifications': 'Notifications',
    'system': 'System',
    'theme': 'Theme',
    'language': 'Language',
    'dark': 'Dark',
    'light': 'Light',
    'system-theme': 'System',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    
    // Dashboard
    'total-requests': 'Total Requests',
    'pending-requests': 'Pending Requests',
    'approved-requests': 'Approved Requests',
    'fuel-consumption': 'Fuel Consumption',
    'monthly-consumption': 'Monthly Consumption',
    'weekly-consumption': 'Weekly Consumption',
    'consumption-by-department': 'Consumption by Department',
    'consumption-by-fuel-type': 'Consumption by Fuel Type',
    'recent-activity': 'Recent Activity',
    'quick-stats': 'Quick Stats',
    
    // Requisitions
    'requisition': 'Requisition',
    'requisition-number': 'Requisition Number',
    'requisition-date': 'Requisition Date',
    'requester': 'Requester',
    'department': 'Department',
    'fuel-type': 'Fuel Type',
    'quantity': 'Quantity',
    'priority': 'Priority',
    'status': 'Status',
    'justification': 'Justification',
    'approver': 'Approver',
    'approval-date': 'Approval Date',
    'needed-date': 'Needed Date',
    'request-date': 'Request Date',
    'details': 'Details',
    'actions': 'Actions',
    
    // Fuel types
    'gasoline': 'Gasoline',
    'ethanol': 'Ethanol',
    'diesel': 'Diesel',
    'diesel-s10': 'Diesel S10',
    
    // Departments
    'logistics': 'Logistics',
    'maintenance': 'Maintenance',
    'administration': 'Administration',
    'operations': 'Operations',
    'transport': 'Transport',
    
    // Priorities
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent',
    
    // Forms
    'required-field': 'Required field',
    'select-option': 'Select an option',
    'enter-value': 'Enter a value',
    'invalid-email': 'Invalid email',
    'password-too-short': 'Password too short',
    'passwords-dont-match': 'Passwords don\'t match',
    'form-errors': 'Please fix form errors',
    'form-saved': 'Form saved successfully',
    
    // Reports
    'generate-report': 'Generate Report',
    'report-period': 'Report Period',
    'start-date': 'Start Date',
    'end-date': 'End Date',
    'report-type': 'Report Type',
    'consumption-report': 'Consumption Report',
    'requisitions-report': 'Requisitions Report',
    'department-report': 'Department Report',
    'fuel-type-report': 'Fuel Type Report',
    'monthly-reports': 'Monthly Reports',
    'weekly-reports': 'Weekly Reports',
    'annual-reports': 'Annual Reports',
    
    // Settings
    'general-settings': 'General Settings',
    'user-preferences': 'User Preferences',
    'system-settings': 'System Settings',
    'notification-settings': 'Notification Settings',
    'change-password': 'Change Password',
    'current-password': 'Current Password',
    'new-password': 'New Password',
    'confirm-password': 'Confirm Password',
    'new-requisitions': 'New Requisitions',
    'pending-approvals': 'Pending Approvals',
    'requisition-status': 'Requisition Status',
    'personal-info': 'Personal Information',
    'contact-info': 'Contact Information',
    
    // User
    'username': 'Username',
    'full-name': 'Full name',
    'email': 'Email',
    'phone': 'Phone',
    'position': 'Position',
    'role': 'Role',
    'last-login': 'Last login',
    'account-created': 'Account created',
    
    // Messages
    'no-data': 'No data found',
    'no-results': 'No results found',
    'loading-data': 'Loading data...',
    'save-success': 'Saved successfully',
    'delete-success': 'Deleted successfully',
    'update-success': 'Updated successfully',
    'operation-failed': 'Operation failed',
    'confirm-delete': 'Are you sure you want to delete?',
    'confirm-action': 'Are you sure you want to continue?',
    'unsaved-changes': 'There are unsaved changes',
    
    // Pagination
    'page': 'Page',
    'of': 'of',
    'items-per-page': 'Items per page',
    'total-items': 'Total items',
    'previous': 'Previous',
    'next': 'Next',
    'first': 'First',
    'last': 'Last',
    
    // Date and time
    'today': 'Today',
    'yesterday': 'Yesterday',
    'this-week': 'This week',
    'last-week': 'Last week',
    'this-month': 'This month',
    'last-month': 'Last month',
    'this-year': 'This year',
    'date-format': 'MM/DD/YYYY',
    'time-format': 'HH:mm',
    
    // Print
    'print-document': 'Print Document',
    'print-preview': 'Print Preview',
    'print-options': 'Print Options',
    
    // About
    'version': 'Version',
    'last-update': 'Last Update',
    'developed-by': 'Developed by',
    'about-system': 'About System',
    'system-info': 'System Information',
    
    // Additional translations
    'filters': 'Filters',
    'search-requisitions': 'Search requisitions...',
    'filter-by-status': 'Filter by status',
    'filter-by-department': 'Filter by department',
    'all-statuses': 'All statuses',
    'all-departments': 'All departments',
    'clear-filters': 'Clear Filters',
    'no-results-with-filters': 'No requisitions found with applied filters',
    'manage-all-fuel-requisitions': 'Manage all fuel requisitions',
    'consumed-liters': 'Consumed Liters',
    'quick-actions': 'Quick Actions',
    'approve-pending': 'Approve Pending',
    'recent-requisitions': 'Recent Requisitions',
    'view-all': 'View all',
    'fuel-requisitions-overview': 'Fuel requisitions overview',
    'loading-dashboard': 'Loading dashboard...',
    'loading-reports': 'Loading reports...',
    'create-new-fuel-requisition': 'Create a new fuel requisition',
    'requisition-form': 'Requisition Form',
    'fill-required-data': 'Fill in the required data to create a new fuel requisition',
    'fuel-consumption-analysis': 'Fuel consumption analysis and statistics',
    'date': 'Date',
    'enter-full-name': 'Your full name',
    'enter-email': 'your@email.com',
    'select-department': 'Select a department',
    'enter-phone': '(11) 99999-9999',
    'enter-position': 'Your position at the company',
    'save-changes': 'Save Changes',
    'account-info': 'Account Information',
    'account-details': 'Details about your account in the system',
    'last-updated': 'Last Updated',
    'manage-profile-preferences': 'Manage your profile and system preferences',
  },
  'es-ES': {
    // Navegación
    'dashboard': 'Tablero',
    'requisitions': 'Requisiciones',
    'new-requisition': 'Nueva Requisición',
    'reports': 'Informes',
    'settings': 'Configuraciones',
    
    // Acciones
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'edit': 'Editar',
    'delete': 'Eliminar',
    'view': 'Ver',
    'print': 'Imprimir',
    'export': 'Exportar',
    'import': 'Importar',
    'search': 'Buscar',
    'filter': 'Filtrar',
    'clear': 'Limpiar',
    'submit': 'Enviar',
    'close': 'Cerrar',
    'open': 'Abrir',
    'add': 'Agregar',
    'remove': 'Eliminar',
    'update': 'Actualizar',
    'create': 'Crear',
    'confirm': 'Confirmar',
    'approve': 'Aprobar',
    'reject': 'Rechazar',
    
    // Estados
    'loading': 'Cargando...',
    'success': 'Éxito',
    'error': 'Error',
    'warning': 'Advertencia',
    'info': 'Información',
    'pending': 'Pendiente',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'fulfilled': 'Realizado',
    'cancelled': 'Cancelado',
    
    // Sistema
    'fuel-control-system': 'Sistema de Control de Combustible',
    'profile': 'Perfil',
    'security': 'Seguridad',
    'notifications': 'Notificaciones',
    'system': 'Sistema',
    'theme': 'Tema',
    'language': 'Idioma',
    'dark': 'Oscuro',
    'light': 'Claro',
    'system-theme': 'Sistema',
    'enabled': 'Activado',
    'disabled': 'Desactivado',
    
    // Tablero
    'total-requests': 'Total de Requisiciones',
    'pending-requests': 'Requisiciones Pendientes',
    'approved-requests': 'Requisiciones Aprobadas',
    'fuel-consumption': 'Consumo de Combustible',
    'monthly-consumption': 'Consumo Mensual',
    'weekly-consumption': 'Consumo Semanal',
    'consumption-by-department': 'Consumo por Departamento',
    'consumption-by-fuel-type': 'Consumo por Tipo de Combustible',
    'recent-activity': 'Actividad Reciente',
    'quick-stats': 'Estadísticas Rápidas',
    
    // Requisiciones
    'requisition': 'Requisición',
    'requisition-number': 'Número de Requisición',
    'requisition-date': 'Fecha de Requisición',
    'requester': 'Solicitante',
    'department': 'Departamento',
    'fuel-type': 'Tipo de Combustible',
    'quantity': 'Cantidad',
    'priority': 'Prioridad',
    'status': 'Estado',
    'justification': 'Justificación',
    'approver': 'Aprobador',
    'approval-date': 'Fecha de Aprobación',
    'needed-date': 'Fecha Necesaria',
    'request-date': 'Fecha de Solicitud',
    'details': 'Detalles',
    'actions': 'Acciones',
    
    // Tipos de combustible
    'gasoline': 'Gasolina',
    'ethanol': 'Etanol',
    'diesel': 'Diésel',
    'diesel-s10': 'Diésel S10',
    
    // Departamentos
    'logistics': 'Logística',
    'maintenance': 'Mantenimiento',
    'administration': 'Administración',
    'operations': 'Operaciones',
    'transport': 'Transporte',
    
    // Prioridades
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'urgent': 'Urgente',
    
    // Formularios
    'required-field': 'Campo requerido',
    'select-option': 'Seleccione una opción',
    'enter-value': 'Ingrese un valor',
    'invalid-email': 'Email inválido',
    'password-too-short': 'Contraseña muy corta',
    'passwords-dont-match': 'Las contraseñas no coinciden',
    'form-errors': 'Corrija los errores del formulario',
    'form-saved': 'Formulario guardado exitosamente',
    
    // Informes
    'generate-report': 'Generar Informe',
    'report-period': 'Período del Informe',
    'start-date': 'Fecha de Inicio',
    'end-date': 'Fecha de Fin',
    'report-type': 'Tipo de Informe',
    'consumption-report': 'Informe de Consumo',
    'requisitions-report': 'Informe de Requisiciones',
    'department-report': 'Informe por Departamento',
    'fuel-type-report': 'Informe por Tipo de Combustible',
    'monthly-reports': 'Informes Mensuales',
    'weekly-reports': 'Informes Semanales',
    'annual-reports': 'Informes Anuales',
    
    // Configuraciones
    'general-settings': 'Configuraciones Generales',
    'user-preferences': 'Preferencias del Usuario',
    'system-settings': 'Configuraciones del Sistema',
    'notification-settings': 'Configuraciones de Notificación',
    'change-password': 'Cambiar Contraseña',
    'current-password': 'Contraseña Actual',
    'new-password': 'Nueva Contraseña',
    'confirm-password': 'Confirmar Contraseña',
    'new-requisitions': 'Nuevas Requisiciones',
    'pending-approvals': 'Aprobaciones Pendientes',
    'requisition-status': 'Estado de Requisiciones',
    'personal-info': 'Información Personal',
    'contact-info': 'Información de Contacto',
    
    // Usuario
    'username': 'Nombre de usuario',
    'full-name': 'Nombre completo',
    'email': 'Correo electrónico',
    'phone': 'Teléfono',
    'position': 'Cargo',
    'role': 'Rol',
    'last-login': 'Último acceso',
    'account-created': 'Cuenta creada',
    
    // Mensajes
    'no-data': 'No se encontraron datos',
    'no-results': 'No se encontraron resultados',
    'loading-data': 'Cargando datos...',
    'save-success': 'Guardado exitosamente',
    'delete-success': 'Eliminado exitosamente',
    'update-success': 'Actualizado exitosamente',
    'operation-failed': 'Operación falló',
    'confirm-delete': '¿Está seguro que desea eliminar?',
    'confirm-action': '¿Está seguro que desea continuar?',
    'unsaved-changes': 'Hay cambios sin guardar',
    
    // Paginación
    'page': 'Página',
    'of': 'de',
    'items-per-page': 'Elementos por página',
    'total-items': 'Total de elementos',
    'previous': 'Anterior',
    'next': 'Siguiente',
    'first': 'Primero',
    'last': 'Último',
    
    // Fecha y hora
    'today': 'Hoy',
    'yesterday': 'Ayer',
    'this-week': 'Esta semana',
    'last-week': 'Semana pasada',
    'this-month': 'Este mes',
    'last-month': 'Mes pasado',
    'this-year': 'Este año',
    'date-format': 'DD/MM/AAAA',
    'time-format': 'HH:mm',
    
    // Impresión
    'print-document': 'Imprimir Documento',
    'print-preview': 'Vista Previa de Impresión',
    'print-options': 'Opciones de Impresión',
    
    // Acerca de
    'version': 'Versión',
    'last-update': 'Última Actualización',
    'developed-by': 'Desarrollado por',
    'about-system': 'Acerca del Sistema',
    'system-info': 'Información del Sistema',
    
    // Traducciones adicionales
    'filters': 'Filtros',
    'search-requisitions': 'Buscar requisiciones...',
    'filter-by-status': 'Filtrar por estado',
    'filter-by-department': 'Filtrar por departamento',
    'all-statuses': 'Todos los estados',
    'all-departments': 'Todos los departamentos',
    'clear-filters': 'Limpiar Filtros',
    'no-results-with-filters': 'No se encontraron requisiciones con los filtros aplicados',
    'manage-all-fuel-requisitions': 'Gestionar todas las requisiciones de combustible',
    'consumed-liters': 'Litros Consumidos',
    'quick-actions': 'Acciones Rápidas',
    'approve-pending': 'Aprobar Pendientes',
    'recent-requisitions': 'Requisiciones Recientes',
    'view-all': 'Ver todas',
    'fuel-requisitions-overview': 'Resumen de requisiciones de combustible',
    'loading-dashboard': 'Cargando tablero...',
    'loading-reports': 'Cargando informes...',
    'create-new-fuel-requisition': 'Crear una nueva requisición de combustible',
    'requisition-form': 'Formulario de Requisición',
    'fill-required-data': 'Complete los datos necesarios para crear una nueva requisición de combustible',
    'fuel-consumption-analysis': 'Análisis y estadísticas de consumo de combustible',
    'date': 'Fecha',
    'enter-full-name': 'Su nombre completo',
    'enter-email': 'su@email.com',
    'select-department': 'Seleccione un departamento',
    'enter-phone': '(11) 99999-9999',
    'enter-position': 'Su cargo en la empresa',
    'save-changes': 'Guardar Cambios',
    'account-info': 'Información de la Cuenta',
    'account-details': 'Detalles sobre su cuenta en el sistema',
    'last-updated': 'Última Actualización',
    'manage-profile-preferences': 'Gestione su perfil y preferencias del sistema',
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
