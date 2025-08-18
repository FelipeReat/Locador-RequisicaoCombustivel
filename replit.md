# Sistema Controle de Abastecimento

## Overview

O Controle de Abastecimento é um sistema abrangente de gerenciamento de requisições de combustível construído com uma arquitetura full-stack moderna. A aplicação permite aos usuários criar, rastrear e gerenciar requisições de combustível com recursos para fluxos de aprovação, análises e relatórios. O sistema é projetado para gerenciamento corporativo de combustível com departamentos como logística, manutenção, transporte e operações.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 18, 2025 - Migration to Replit Environment and Bug Fixes**
- Successfully completed migration from Replit Agent to standard Replit environment
- Created PostgreSQL database and migrated all schema tables (users, vehicles, fuel_requisitions, suppliers, companies, fuel_records)
- Fixed React state update warning in SyncIndicator component using requestAnimationFrame
- Added debugging logs to fuel tracking form to identify save button issues
- Verified backend API endpoints are working correctly for fuel records
- Enhanced form validation with proper default values for vehicle and operator selection
- Fixed database connection issues and confirmed all tables are properly created

**August 14, 2025 - Complete Performance Optimization and Bug Fixes**
- Successfully resolved all critical performance issues affecting requisition approvals and fleet status updates
- Optimized database cache system reducing TTL from 10-15s to 1s for maximum responsiveness
- Implemented aggressive cache clearing for critical operations (status updates, approvals)
- Added no-cache HTTP headers for status update endpoints to prevent browser caching conflicts
- Fixed fleet management vehicle status persistence issues - status now maintains correctly after page reload
- Reduced React Query cache times to 2 seconds with optimized invalidation strategies
- Eliminated redundant refetch operations that were causing UI delays and multiple clicks
- System now provides instant feedback for all critical operations (approvals, status changes)
- Requisition approvals now work with single click without requiring screen navigation or multiple attempts
- Fleet vehicle status changes persist correctly through page reloads and maintain database consistency

**August 13, 2025 - Performance Optimization and Stability Fixes**
- Successfully implemented comprehensive performance optimizations to address system slowness
- Fixed critical plugin errors and "Failed to fetch" issues by removing problematic compression middleware
- Eliminated PerformanceMonitor component that was causing unhandled rejections in browser console
- Applied conservative HTTP caching headers (10-60 seconds) across all API endpoints for improved response times
- Implemented pagination (20 items per page) for fuel requisitions to reduce data transfer
- Optimized React Query settings with balanced cache durations (1-3 minutes) for better performance
- Enhanced storage layer with memory caching (30-second duration) for frequently accessed statistics
- Maintained cache invalidation on mutations to ensure data consistency
- System now stable with retained performance improvements and faster page navigation

**August 12, 2025 - Fuel Efficiency Report Implementation**
- Successfully created comprehensive fuel efficiency reporting feature in reports page
- Added new API endpoint `/api/fuel-requisitions/stats/fuel-efficiency` for vehicle efficiency data
- Implemented fuel efficiency calculations (km/liter) based on approved requisitions
- Created detailed table showing vehicle plate, model, total km, total liters, and efficiency rating
- Added visual efficiency chart with color-coded performance indicators (Excellent/Good/Low)
- Integrated efficiency categories: Excellent (≥15 km/L), Good (≥10 km/L), Low (<10 km/L)
- Enhanced reports page with professional styling and responsive design
- All data calculations use only approved and fulfilled requisitions for accuracy

**August 04, 2025 - Security and Access Control Implementation**
- Successfully implemented role-based access control in dashboard
- Disabled action buttons for employees in dashboard quick actions and table actions
- Restricted data cleanup functionality to administrators only
- Implemented bulk password reset functionality for administrators
- Reset all user passwords to "blomaq123" except admin user (password: "admin123")
- Removed edit, reject, and approve buttons from requisition details modal for employee users
- Enhanced security with proper permission checks throughout the application
- Applied usePermissions hook consistently across all action components

**August 01, 2025 - Modern Login System Implementation**
- Successfully implemented a modern login system with visual design based on user requirements
- Created elegant login page with "Módulo de requisição de abastecimento" title
- Added user authentication functionality with multiple test users
- Implemented logout functionality with both sidebar buttons (user area and bottom button)
- Added user session management with proper state handling
- Created AuthProvider context for global authentication state
- Enhanced UI with modern gradient design and professional styling
- Integrated authentication seamlessly with existing application flow

**July 31, 2025 - Complete Project Migration and Issues Resolution**
- Successfully completed migration from Replit Agent to Replit environment
- Resolved all 8 user-reported critical issues:
  1. Fixed flag update delays with optimized state management
  2. Solved deletion problems with real-time UI updates
  3. Corrected PDF supplier names to show formal names in reports
  4. Implemented mileage reset functionality with MileageResetDialog component
  5. Added comprehensive data cleanup feature with DataCleanupDialog
  6. Fixed form validation errors and null handling throughout the system
  7. Resolved all TypeScript diagnostic errors (LSP clean)
  8. Enhanced UI responsiveness with immediate data reflection
- Added new backend API routes for data cleanup and vehicle mileage updates
- Implemented proper query key management for real-time updates
- Enhanced PDF generation to display formal supplier names while maintaining simple UI names
- Created reusable dialog components for system maintenance operations
- All components now properly invalidate queries for immediate UI updates

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