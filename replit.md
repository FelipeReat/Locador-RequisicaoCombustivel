# Sistema Controle de Abastecimento

## Overview

O Controle de Abastecimento é um sistema abrangente de gerenciamento de requisições de combustível para uso corporativo, projetado para departamentos como logística, manutenção, transporte e operações. Ele permite aos usuários criar, rastrear e gerenciar requisições de combustível, incluindo fluxos de aprovação, análises e relatórios. O sistema visa otimizar o gerenciamento de combustível e fornecer insights para tomadas de decisão.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Design Principles**: Responsive design, professional styling, intuitive user experience (e.g., searchable vehicle selection, clear visual indications).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **ORM**: Drizzle ORM
- **Validation**: Zod schemas shared with frontend
- **Authentication**: Session-based authentication with role-based access control (RBAC) for administrators, managers, and employees.

### Database Architecture
- **Database**: PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM (TypeScript-first)
- **Schema Management**: Shared schema definitions in `/shared/schema.ts`, migrations managed by Drizzle Kit.
- **Caching**: Aggressive caching and invalidation strategies for performance (e.g., 1s TTL for critical data, memory caching for statistics).

### Key Features and Components
- **Fuel Requisition Management**: Creation, tracking, approval (pending, approved, rejected, fulfilled), and fulfillment of fuel requisitions.
  - Includes detailed vehicle information, justification, and approval workflow.
- **Purchase Order Generation**: Controlled generation of purchase orders (once per requisition).
- **User Management**: Basic user management with role-based access.
- **Reporting**: Comprehensive fuel efficiency reports (km/liter), monthly analysis, and PDF export for requisitions and reports.
- **PDF Generation**: Automatic PDF generation for new requisitions and reports, including company branding.
- **Fleet Management**: Persistence of vehicle status and details.
- **System Maintenance**: Data cleanup and mileage reset functionalities for administrators.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: ORM for database interactions.
- **drizzle-zod**: Zod schema integration with Drizzle.
- **@tanstack/react-query**: Server state management and caching.
- **react-hook-form**: Form handling.
- **@radix-ui/***: UI component primitives.
- **tailwindcss**: CSS framework.
- **recharts**: Data visualization.
- **lucide-react**: Icon library.
- **wouter**: Client-side routing.
- **vite**: Frontend build tool.
- **typescript**: Language.
- **esbuild**: Backend bundling.
- **tsx**: TypeScript execution for development.
```