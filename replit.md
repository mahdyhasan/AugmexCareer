# Job Portal System

## Overview
This is a comprehensive job portal application for a software company that frequently hires. The system facilitates HR administrators in managing job listings and candidates in browsing and applying for jobs. Key capabilities include AI-powered resume analysis, dynamic application forms, and a complete application tracking system. The project aims to streamline the hiring process, leveraging AI for efficiency and providing a robust platform for both recruiters and applicants.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components, Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **UI/UX Decisions**: Modern Material UI redesign with Augmex branding, professional Header component, JobFilters, JobCard components, hero section, smart filtering, responsive design.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful API
- **File Handling**: Multer for resume uploads
- **Development**: Vite for development server

### Database Layer
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema**: Strongly typed with Zod validation
- **Migrations**: Drizzle Kit

### Core Features
- **Authentication System**: Email/password authentication, role-based access control (admin, HR, recruiter, candidate), secure session management with bcrypt hashing.
- **Job Management**: CRUD operations for job postings, dynamic application form configuration, categorization, filtering, and status management. Supports job-specific application management.
- **Application Processing**: Resume upload and text extraction, AI-powered resume analysis, dynamic form rendering, application status tracking, email notifications.
- **AI Integration**: OpenAI (GPT-4o) for resume analysis, automated scoring, skills matching, experience evaluation, hiring recommendations, competency breakdown, cultural fit assessment, salary prediction, duplicate detection, and candidate ranking. Provides an AI Insights Dashboard.
- **Email System**: Uses nodemailer for Zoho mail integration, supporting email notifications for various system events.
- **File Management**: Secure file upload with validation and size limits, secure file serving.
- **Application Workflow**: Kanban board for application status management, interview scheduling with automated time slot generation and email notifications.
- **Reporting & Analytics**: Comprehensive dashboard with hiring funnel analysis, conversion rates, performance indicators, diversity metrics, and export capabilities.
- **Advanced Features**: Auto-fill using resume parsing (for candidate info), job alert email subscriptions, candidate notes and comments system with role-based access.

## External Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **drizzle-orm**: Type-safe ORM
- **openai**: AI-powered resume analysis
- **multer**: File upload handling
- **react-hook-form**: Form management
- **zod**: Runtime type validation
- **bcrypt**: Password hashing
- **express-session**: Session management
- **nodemailer**: Email sending
- **tsx**: TypeScript execution
- **tailwindcss**: Utility-first CSS framework