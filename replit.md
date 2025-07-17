# FuelControl System

## Overview

FuelControl is a comprehensive fuel requisition management system built with a modern full-stack architecture. The application allows users to create, track, and manage fuel requisitions with features for approval workflows, analytics, and reporting. The system is designed for corporate fuel management with departments like logistics, maintenance, transport, and operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 17, 2025 - PDF Generation and Theme Improvements**
- Fixed dark theme inconsistencies across all pages (new-requisition, dashboard, reports, requisitions)
- Implemented automatic PDF generation for each new requisition created
- Added comprehensive PDF generation library with company branding and detailed formatting
- Enhanced reports page with:
  - Monthly analysis functionality with date selection
  - PDF export for complete reports and monthly analysis
  - Monthly trend chart showing requisition patterns
  - Improved dark theme support for all report components
- Updated dashboard with proper dark theme styling for all cards, buttons, and tables
- All PDF documents include: company info, requisition details, fuel information, justification, approval data, and professional formatting

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas shared between frontend and backend
- **Development**: Hot module replacement via Vite integration

### Database Architecture
- **ORM**: Drizzle ORM with TypeScript-first approach
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migrations**: Managed through Drizzle Kit
- **Connection**: Neon Database serverless connection

## Key Components

### Database Schema
- **Users Table**: Basic user management with username/password
- **Fuel Requisitions Table**: Core entity storing all requisition data including:
  - Requester information and department
  - Fuel type (gasoline, ethanol, diesel, diesel S10)
  - Quantity and justification
  - Status workflow (pending, approved, rejected, fulfilled)
  - Approval tracking with approver and dates
  - Priority levels (low, medium, high, urgent)

### API Endpoints
- **GET /api/fuel-requisitions**: Retrieve all requisitions
- **GET /api/fuel-requisitions/:id**: Get specific requisition
- **POST /api/fuel-requisitions**: Create new requisition
- **PUT /api/fuel-requisitions/:id**: Update requisition
- **PATCH /api/fuel-requisitions/:id/status**: Update status with approval workflow
- **Analytics endpoints**: Stats for dashboard and reporting

### Frontend Pages
- **Dashboard**: Overview with stats and recent requisitions
- **Requisitions**: Full listing with filtering and search
- **New Requisition**: Form for creating requisitions
- **Reports**: Analytics and data visualization with charts

### UI Components
- **Layout**: Sidebar navigation with header
- **Forms**: Validated forms with error handling
- **Modals**: Requisition details and approval workflows
- **Status System**: Visual badges for requisition states
- **Charts**: Data visualization using Recharts

## Data Flow

1. **Requisition Creation**: Users fill out forms validated by Zod schemas
2. **Server Processing**: Express routes handle CRUD operations with Drizzle ORM
3. **Database Storage**: PostgreSQL stores normalized data
4. **State Management**: React Query manages server state with caching
5. **UI Updates**: Real-time updates via query invalidation
6. **Approval Workflow**: Status updates trigger notifications and audit trails

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Database connection and query execution
- **drizzle-orm**: Type-safe database operations
- **drizzle-zod**: Schema validation integration
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation

### UI Libraries
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **recharts**: Data visualization components
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety
- **esbuild**: Fast bundling for production
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle Kit manages schema migrations

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Single-file deployment with static assets
- **Database**: Environment-based connection strings

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build both frontend and backend for production
- `npm run start`: Start production server
- `npm run db:push`: Push schema changes to database

The system uses a monorepo structure with shared types and schemas, enabling type safety across the full stack while maintaining clean separation of concerns between frontend and backend code.