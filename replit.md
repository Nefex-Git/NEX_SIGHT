# Overview

This is a full-stack business intelligence application called NEX Sight that enables users to analyze data through AI-powered conversations and visualizations. The application combines data warehousing capabilities with natural language processing to make business intelligence accessible through chat interfaces and voice interactions.

The system allows users to upload datasets (primarily CSV files), ask questions about their data in natural language or voice, and receive intelligent responses with charts, KPIs, and insights. It features a modern dashboard with data source management, chart creation, and an AI assistant that can interpret business questions and generate appropriate visualizations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with a dark theme design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Custom hook-based auth system with protected routes

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **AI Integration**: OpenAI API for natural language processing and data analysis
- **File Handling**: Multer for CSV file uploads with local storage
- **Authentication**: Passport.js with local strategy and session-based auth

## Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Session Storage**: PostgreSQL with connect-pg-simple
- **File Storage**: Local filesystem for uploaded CSV files
- **Database Migrations**: Drizzle Kit for schema management

## Authentication and Authorization
- **Strategy**: Session-based authentication using Passport.js
- **Password Security**: Scrypt for password hashing with salt
- **Session Management**: Express sessions with PostgreSQL store
- **Protected Routes**: Custom ProtectedRoute component with auth context

## External Service Integrations
- **AI Services**: OpenAI GPT API for data analysis and natural language processing
- **Database Hosting**: Neon PostgreSQL serverless database
- **Development Tools**: Replit-specific plugins for development environment
- **Chart Libraries**: Recharts for data visualizations (line, bar, pie charts)

## Key Design Patterns
- **Monorepo Structure**: Shared schema and types between client and server
- **Component Architecture**: Modular UI components with clear separation of concerns
- **API Layer**: RESTful endpoints with consistent error handling and response formatting
- **Data Flow**: React Query for caching and synchronization with optimistic updates
- **Voice Integration**: Browser-based speech recognition and synthesis capabilities
- **File Processing**: Secure file upload with type validation and processing pipelines

The application follows a modern full-stack architecture with emphasis on type safety, user experience, and AI-powered data insights. The codebase is structured for scalability with clear separation between data access, business logic, and presentation layers.