# Job Portal System

## Overview

This is a comprehensive job portal application built for a software company that frequently hires. The system allows HR administrators to post and manage job listings while enabling candidates to browse jobs and submit applications. The application features AI-powered resume analysis, dynamic application forms, and a complete application tracking system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful API with structured endpoints
- **File Handling**: Multer for resume uploads
- **Development**: Vite for development server and HMR

### Database Layer
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema**: Strongly typed with Zod validation
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Simple email/password authentication
- Role-based access control (admin, HR, recruiter, candidate)
- Session management without external auth providers
- In-memory user storage for development

### Job Management
- CRUD operations for job postings
- Dynamic application form configuration per job
- Job categorization and filtering
- Status management (active, paused, closed, draft)
- SEO-friendly job slugs

### Application Processing
- Resume upload and text extraction
- AI-powered resume analysis using OpenAI
- Dynamic form rendering based on job requirements
- Application status tracking with history
- Email notifications and candidate communication

### AI Integration
- OpenAI integration for resume analysis
- Automated scoring based on job requirements
- Skills matching and experience evaluation
- Hiring recommendations (hire/interview/reject)

## Data Flow

### Job Application Process
1. Candidate browses public job listings
2. Selects job and views detailed requirements
3. Submits application with resume and custom form data
4. AI analysis runs automatically on resume
5. HR receives application with AI insights
6. Status updates tracked throughout hiring process

### Admin Dashboard Flow
1. HR logs in to admin dashboard
2. Views analytics and application metrics
3. Manages job postings and application reviews
4. Updates application statuses
5. Reviews AI analysis results for decision making

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **drizzle-orm**: Type-safe ORM
- **openai**: AI-powered resume analysis
- **multer**: File upload handling
- **react-hook-form**: Form management
- **zod**: Runtime type validation

### Development Tools
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific integrations

## Deployment Strategy

### Build Process
- Frontend built with Vite to static assets
- Backend bundled with esbuild for Node.js
- TypeScript compilation with strict type checking
- Optimized production builds with code splitting

### Environment Configuration
- Database URL required for PostgreSQL connection
- OpenAI API key for resume analysis features
- Environment-specific configurations for development/production
- Replit-specific optimizations for cloud deployment

### Database Management
- Schema defined in shared/schema.ts
- Migrations managed through Drizzle Kit
- Push-based deployment with `db:push` command
- PostgreSQL dialect with UUID primary keys

The application follows a monorepo structure with shared types and schemas, enabling type safety across the full stack while maintaining clear separation between client and server code.

## Recent Changes (January 31, 2025)

### Phase 1 Critical Fixes Completed

#### Resume Upload System Implementation
- Created comprehensive file storage service (`server/services/fileStorage.ts`)
- Implemented proper file handling with automatic directory creation
- Added static file serving for uploaded resumes
- Fixed type errors related to file upload and AI analysis integration

#### Application Status Management with Kanban Board
- Built fully functional drag-and-drop kanban board (`client/src/components/ApplicationsKanban.tsx`)
- Implemented real-time status updates with visual feedback
- Added grid view / kanban board toggle functionality
- Fixed dialog accessibility warnings with proper ARIA descriptions
- Enhanced application status tracking with visual indicators and real-time updates

#### Email System Migration to Zoho
- Successfully replaced SendGrid with nodemailer for Zoho mail integration
- Created comprehensive email settings page with credential configuration
- Implemented email testing functionality to verify SMTP connections
- Added proper error handling and user feedback for email operations

#### Production-Ready File Management
- Implemented secure file upload with validation and size limits
- Added proper file serving with Express static middleware
- Created file management utilities for cleanup and validation
- Enhanced error handling for file operations

The system now has a complete application management workflow with AI-powered resume analysis, drag-and-drop status updates, email notifications, and secure file handling - ready for production deployment.