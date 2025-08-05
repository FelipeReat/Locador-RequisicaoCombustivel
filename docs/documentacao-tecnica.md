# Documentação Técnica - Sistema de Controle de Abastecimento

## 1. Visão Geral do Sistema

O Sistema de Controle de Abastecimento é uma aplicação web full-stack desenvolvida para gerenciar requisições de combustível em ambiente corporativo. O sistema permite criar, rastrear e gerenciar requisições de combustível com fluxos de aprovação, análises e relatórios.

### 1.1 Arquitetura Geral

- **Frontend**: React 18 com TypeScript
- **Backend**: Node.js com Express.js
- **Banco de Dados**: PostgreSQL (Neon Database)
- **ORM**: Drizzle ORM
- **Build Tool**: Vite
- **UI Framework**: Radix UI + shadcn/ui + Tailwind CSS

## 2. Arquitetura do Sistema

### 2.1 Estrutura de Pastas

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Contextos React (Auth, Theme, etc.)
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários e configurações
│   │   └── pages/          # Páginas da aplicação
├── server/                 # Backend Express
│   ├── index.ts           # Servidor principal
│   ├── routes.ts          # Definição das rotas API
│   ├── storage.ts         # Camada de acesso a dados
│   └── vite.ts            # Configuração Vite
├── shared/                 # Código compartilhado
│   └── schema.ts          # Schemas Zod e tipos TypeScript
└── docs/                   # Documentação
```

### 2.2 Tecnologias Principais

#### Frontend
- **React 18**: Framework principal
- **TypeScript**: Tipagem estática
- **Wouter**: Roteamento leve
- **TanStack Query**: Gerenciamento de estado do servidor
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas
- **Tailwind CSS**: Estilização
- **Radix UI**: Componentes acessíveis
- **Recharts**: Visualização de dados

#### Backend
- **Express.js**: Framework web
- **Drizzle ORM**: ORM TypeScript-first
- **Neon Database**: PostgreSQL serverless
- **Zod**: Validação de dados
- **ESBuild**: Bundling para produção

## 3. Banco de Dados

### 3.1 Estrutura das Tabelas

#### Tabela `users`
```sql
- id: serial (PK)
- username: text (unique)
- password: text
- email: text
- fullName: text
- departmentId: integer
- phone: text
- position: text
- role: text (admin, manager, employee)
- active: text
- hireDate: text
- createdAt: text
- updatedAt: text
```

#### Tabela `vehicles`
```sql
- id: serial (PK)
- plate: text (unique)
- model: text
- brand: text
- year: integer
- fuelType: text
- mileage: text
- status: text
- lastMaintenance: text
- nextMaintenance: text
- createdAt: text
- updatedAt: text
```

#### Tabela `fuelRequisitions`
```sql
- id: serial (PK)
- requesterId: integer (FK)
- supplierId: integer (FK)
- client: text
- vehicleId: integer (FK)
- kmAtual: text
- kmAnterior: text
- kmRodado: text
- tanqueCheio: text
- fuelType: text
- quantity: text
- pricePerLiter: text
- fiscalCoupon: text
- justification: text
- requiredDate: text
- priority: text
- status: text
- approverId: integer
- approvedDate: text
- rejectionReason: text
- createdAt: text
- updatedAt: text
```

#### Tabela `suppliers`
```sql
- id: serial (PK)
- name: text
- fantasia: text
- cnpj: text (unique)
- responsavel: text
- email: text
- phone: text
- address: text
- active: text
- createdAt: text
- updatedAt: text
```

#### Tabela `companies`
```sql
- id: serial (PK)
- name: text
- cnpj: text (unique)
- fullName: text
- contact: text
- phone: text
- email: text
- active: text
- createdAt: text
- updatedAt: text
```

## 4. API Endpoints

### 4.1 Autenticação
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/logout` - Logout do usuário

### 4.2 Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário específico
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário
- `GET /api/user/profile` - Perfil do usuário atual
- `PUT /api/user/profile` - Atualizar perfil
- `POST /api/user/change-password` - Alterar senha

### 4.3 Requisições de Combustível
- `GET /api/fuel-requisitions` - Listar requisições
- `GET /api/fuel-requisitions/:id` - Obter requisição específica
- `POST /api/fuel-requisitions` - Criar requisição
- `PUT /api/fuel-requisitions/:id` - Atualizar requisição
- `PATCH /api/fuel-requisitions/:id/status` - Atualizar status
- `DELETE /api/fuel-requisitions/:id` - Excluir requisição

### 4.4 Estatísticas
- `GET /api/fuel-requisitions/stats/overview` - Estatísticas gerais
- `GET /api/fuel-requisitions/stats/department` - Por departamento
- `GET /api/fuel-requisitions/stats/fuel-type` - Por tipo de combustível

### 4.5 Veículos
- `GET /api/vehicles` - Listar veículos
- `GET /api/vehicles/:id` - Obter veículo específico
- `POST /api/vehicles` - Criar veículo
- `PUT /api/vehicles/:id` - Atualizar veículo
- `PATCH /api/vehicles/:id/status` - Atualizar status
- `PATCH /api/vehicles/:id/mileage` - Atualizar quilometragem
- `DELETE /api/vehicles/:id` - Excluir veículo

### 4.6 Fornecedores
- `GET /api/suppliers` - Listar fornecedores
- `GET /api/suppliers/:id` - Obter fornecedor específico
- `POST /api/suppliers` - Criar fornecedor
- `PUT /api/suppliers/:id` - Atualizar fornecedor
- `DELETE /api/suppliers/:id` - Excluir fornecedor

### 4.7 Empresas
- `GET /api/companies` - Listar empresas
- `GET /api/companies/:id` - Obter empresa específica
- `POST /api/companies` - Criar empresa
- `PUT /api/companies/:id` - Atualizar empresa
- `DELETE /api/companies/:id` - Excluir empresa

### 4.8 Administração
- `POST /api/admin/reset-passwords` - Reset de senhas (admin)
- `DELETE /api/cleanup/requisitions` - Limpeza de requisições
- `DELETE /api/cleanup/vehicles` - Limpeza de veículos
- `DELETE /api/cleanup/suppliers` - Limpeza de fornecedores
- `DELETE /api/cleanup/companies` - Limpeza de empresas

## 5. Componentes Frontend

### 5.1 Páginas Principais
- **Dashboard**: Visão geral com estatísticas e requisições recentes
- **Requisitions**: Lista completa de requisições com filtros
- **New Requisition**: Formulário para criar novas requisições
- **Reports**: Relatórios e análises com gráficos
- **User Management**: Gerenciamento de usuários
- **Fleet Management**: Gerenciamento de frota
- **Suppliers**: Gerenciamento de fornecedores
- **Companies**: Gerenciamento de empresas
- **Settings**: Configurações do sistema
- **Login**: Página de autenticação

### 5.2 Componentes Reutilizáveis
- **Sidebar**: Navegação lateral
- **Header**: Cabeçalho da aplicação
- **ProtectedRoute**: Proteção de rotas
- **RequisitionForm**: Formulário de requisições
- **StatusBadge**: Badge de status
- **DataCleanupDialog**: Dialog para limpeza de dados
- **MileageResetDialog**: Dialog para reset de quilometragem

### 5.3 Contextos
- **AuthContext**: Gerenciamento de autenticação
- **ThemeContext**: Gerenciamento de tema (claro/escuro)
- **LanguageContext**: Gerenciamento de idioma
- **NotificationContext**: Gerenciamento de notificações

## 6. Segurança e Controle de Acesso

### 6.1 Níveis de Usuário
- **Admin**: Acesso completo ao sistema
- **Manager**: Pode aprovar/rejeitar requisições
- **Employee**: Pode criar e visualizar requisições

### 6.2 Funcionalidades por Nível
- **Employees**: Criação de requisições, visualização própria
- **Managers**: Aprovação/rejeição, relatórios departamentais
- **Admins**: Gerenciamento completo, reset de senhas, limpeza de dados

## 7. Recursos Especiais

### 7.1 Geração de PDF
- Geração automática de PDFs para requisições
- Relatórios mensais em PDF
- Formatação profissional com branding da empresa

### 7.2 Análises e Relatórios
- Dashboard com estatísticas em tempo real
- Gráficos de tendências mensais
- Análises por departamento e tipo de combustível
- Exportação de relatórios

### 7.3 Tema Escuro/Claro
- Suporte completo a tema escuro
- Persistência da preferência do usuário
- Transições suaves entre temas

## 8. Configuração e Deploy

### 8.1 Variáveis de Ambiente
```env
DATABASE_URL=postgresql://...
NODE_ENV=development|production
PORT=5000
```

### 8.2 Scripts NPM
```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js",
  "check": "tsc",
  "db:push": "drizzle-kit push"
}
```

### 8.3 Processo de Build
1. **Frontend**: Vite compila React para `dist/public`
2. **Backend**: ESBuild empacota servidor para `dist/index.js`
3. **Database**: Drizzle Kit gerencia migrações

## 9. Monitoramento e Logs

### 9.1 Logs de API
- Logging automático de todas as requisições API
- Tempo de resposta e status codes
- Truncamento de logs longos para performance

### 9.2 Tratamento de Erros
- Middleware global de tratamento de erros
- Validação de dados com Zod
- Mensagens de erro localizadas

## 10. Performance e Otimização

### 10.1 Frontend
- Code splitting automático com Vite
- Lazy loading de componentes
- Cache de queries com TanStack Query
- Otimização de re-renders com React.memo

### 10.2 Backend
- Conexão serverless com Neon Database
- Queries otimizadas com Drizzle ORM
- Middleware de compressão
- Cache de resultados frequentes

## 11. Manutenção e Atualizações

### 11.1 Estrutura Modular
- Separação clara entre frontend e backend
- Schemas compartilhados para consistência
- Componentes reutilizáveis

### 11.2 Versionamento
- Uso de TypeScript para type safety
- Validação de schemas com Zod
- Testes automáticos de tipos

Este sistema foi projetado para ser escalável, maintível e seguro, seguindo as melhores práticas de desenvolvimento web moderno.