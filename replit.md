# InfoProduct Management Portal

## Overview
This full-stack web application is a comprehensive management portal for an info-product business. It provides role-based access for Admin, Sales, Marketing, and CSM departments to manage leads, campaigns, orders, payments, content, email sequences, and customer success metrics. The system features a modern dashboard with KPI cards, interactive charts, data tables, and analytics, supporting business growth and operational efficiency.

## Recent Changes (November 11, 2025)

**StudentModal Student Check-in Tab - Complete Implementation**:
- Connected to existing `students_check_ins` table (15 records linked via student_id)
- Backend API endpoints:
  - `GET /api/v1/csm/students/:id/check-ins` - Fetch all check-in records for a student
  - `PATCH /api/v1/csm/students/:id/check-ins/:checkinId` - Update outcome for a specific check-in
- Frontend features:
  - Table view displaying all check-ins with Date, Name, Email, Outcome, and Actions columns
  - Empty state message when no check-ins exist: "No check-ins submitted yet"
  - "View Full Response" button opens nested detail dialog
  - Detail dialog shows all check-in fields: Wins, Goals, Actions, Challenges, Support, Kajabi Completion, Training Sessions, Mock Calls, Time Effectiveness, Satisfaction, Feedback
  - Outcome dropdown in detail dialog with auto-save on change
  - Color-coded outcome badges (green for Satisfied, red for Refund Risk, orange for others)
  - Nested dialog closes independently without closing main student modal
  - Success toast notification on outcome update
- Backend improvements:
  - Added student ID to `getHighRiskClients()` service method for proper check-in fetching
  - Updated `HighRiskClient` interface to include `id` and `totalPaid` fields
  - Added "View Student" button to High-Risk Clients table Actions column

**StudentModal Progress Tracking Tab - Complete Implementation**:
- Created `students_weekly_progress` table:
  - `id` (SERIAL) - Primary key
  - `student_id` (INTEGER) - Foreign key to students.id with ON DELETE CASCADE
  - `week_number` (INTEGER) - Week identifier
  - `outcome` (TEXT) - Weekly outcome status
  - `notes` (TEXT) - CSM notes for the week
  - `questions` (JSONB) - Dynamic checklist with task completion status
  - `created_at`, `updated_at` - Automatic timestamps
  - Unique constraint on (student_id, week_number)
  - Index on student_id for performance
- Backend API endpoints:
  - `GET /api/v1/csm/students/:id/weekly-progress` - Fetch all weekly progress records for student
  - `PATCH /api/v1/csm/students/:id/weekly-progress/:weekId` - Update outcome, notes, or questions
- Frontend features:
  - Split-view layout: Week list (left) showing all weeks with outcome badges, detail view (right)
  - Auto-selects first week when modal opens
  - Dynamic task checklist generated from JSONB questions field
  - Task checkboxes auto-save immediately on toggle
  - Outcome and Notes fields auto-save on blur
  - Submit button for manual save of all fields
  - Loading states with spinner during saves
  - Optimistic UI updates for immediate visual feedback
  - Color-coded outcome badges (green for Satisfied, orange for Needs Attention, red for Risk of Refund)
  - Real-time data refresh after each save

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using Vite. Routing is handled by Wouter, and state management by TanStack Query for server state and React Context for authentication. UI components leverage Shadcn/ui (built on Radix UI) and Tailwind CSS, with ApexCharts for data visualization. A custom design system defines typography (Inter, JetBrains Mono), layout, spacing, and a HSL-based color system. Authentication involves a login page, protected routes with role-based access, and JWT tokens.

### Backend Architecture
The backend uses Node.js with TypeScript and Express.js. It includes middleware for security (Helmet), rate limiting, cookie parsing, and JSON body parsing. API endpoints are RESTful and organized by domain (auth, sales, marketing, csm, email). Authentication and authorization are handled with JWT tokens in httpOnly cookies, bcryptjs for password hashing, and middleware for role-based access control (ADMIN, SALES, MARKETING, CSM). The database layer uses Prisma Client with PostgreSQL (Neon serverless).

### Data Storage
The application uses a PostgreSQL database (Neon serverless). Key Prisma models include: User (authentication, roles), Organization (multi-tenancy), Lead, Campaign, Product, Order, Payment, PaymentPlan, EmailSequence, EmailEvent, ContentItem, AdSpend, EditorContractor, and OnboardingEvent. The database is seeded with demo users and sample data for all entities.

### UI/UX Decisions
The interface features a fixed sidebar navigation, responsive grid layouts, and card-based content. Typography uses Inter for general text and JetBrains Mono for numerical data. A consistent spacing scale and an HSL-based color system are applied using Tailwind CSS variables for theming.

### Technical Implementations & Feature Specifications
- **Dashboard**: KPI cards, interactive charts, sortable/filterable/exportable data tables, date range selection.
- **Authentication**: JWT-based, httpOnly cookies, bcryptjs hashing, role-based access control (RBAC).
- **CSM Portal**: Tracks active members, total owed, high-risk clients, onboarding compliance, and overdue AR. Includes student management (personal info, onboarding progress, CSM assignment), check-ins, and auto-save functionality for updates.
- **Marketing Portal**: Manages content (Notion embeds with toggles), ad spend analytics (total spend, campaign performance, CTR, CPC, CPL), and email broadcast metrics (total broadcasts, open/click rates, time series data).
- **Sales Portal**: Displays key sales metrics, including company pacing, closer performance (booked calls, live calls, offers made, closed-won revenue/deals), and setter metrics.
- **Data Consistency**: Ensures summary counts and table data use consistent JOIN logic and case-insensitive matching.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: PostgreSQL database connection.
- `@prisma/client`: Database ORM.
- `bcryptjs`: Password hashing.
- `jsonwebtoken`: JWT generation and verification.
- `express-rate-limit`: API rate limiting.
- `helmet`: Security headers.
- `cookie-parser`: HTTP cookie parsing.

### Frontend Libraries
- `@tanstack/react-query`: Server state management.
- `wouter`: Lightweight routing.
- `@radix-ui/*`: Unstyled accessible UI primitives.
- `apexcharts` & `react-apexcharts`: Chart rendering.
- `react-hook-form` & `@hookform/resolvers`: Form state management.
- `zod`: Schema validation.
- `tailwindcss`: Utility-first CSS framework.
- `class-variance-authority` & `clsx`: Utility for conditional class names.

### Development Tools
- `vite`: Build tool and dev server.
- `typescript`: Type safety.
- `tsx`: TypeScript execution for development.
- `esbuild`: Production build bundling.
- `@replit/vite-plugin-*`: Replit-specific dev tooling.