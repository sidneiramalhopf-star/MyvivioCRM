# Myvivio CRM - Gym & Corporate Wellness

## Overview
Myvivio CRM is an intelligent management system for gyms and corporate wellness programs. It leverages AI-driven optimization to enhance engagement, ROI, and productivity. The platform offers comprehensive tools for managing users, programs, schedules, and facilities, with a strong emphasis on data-driven insights and a modern user experience. Its primary goal is to serve as a unified platform for wellness businesses, providing features from detailed attendance tracking to advanced analytics and automated communication.

## User Preferences
I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`. I want iterative development. I prefer simple language. I like functional programming. Ask before making major changes.

## System Architecture
The Myvivio CRM employs a full-stack architecture, featuring a FastAPI backend and a vanilla HTML, CSS, and JavaScript frontend, implemented as a Single Page Application (SPA).

### UI/UX Decisions
- **Branding**: Professional aesthetic inspired by VIVIO wellness platforms.
- **Color Palette**: Professional palette including Accent Blue (#62b1ca), Dark Blue (#1f2746), Medium Blue (#333f6e), White, and Black.
- **Iconography**: Exclusively uses Font Awesome 6.4.0 icons.
- **Layout**: Fixed left-hand navigation sidebar (6 main pages) and a dynamic, collapsible unified right sidebar that adapts content based on the active page.
- **Dashboard**: Tab-based Home dashboard with "Day-to-day" and "Performance" views.
- **Interactivity**: Dynamic calendar, quick event creation, interactive sidebar elements with animations, and toast notifications.
- **Responsiveness**: Designed to be responsive, with the sidebar adapting to full width on mobile.

### Technical Implementations
- **Backend Framework**: FastAPI.
- **Frontend**: HTML5, CSS3, and vanilla JavaScript.
- **Database**: SQLAlchemy ORM with SQLite for development, designed for easy migration to PostgreSQL.
- **Authentication**: JWT-based authentication using PyJWT and HTTPBearer, with Argon2 for secure password hashing.
- **Data Models**: Comprehensive models for `Unidade`, `Usuario`, `Visitante`, `Programa`, `Sala`, `Instrutor`, `EventoCalendario`, `EventoAula`, `ReservaAula`, `Attendance`, and `Exercicio`.
- **Attendance System**: "Single Source of Truth" attendance system with validated statuses and unique database constraints.
- **File Upload System**: Secure file upload for exercise photos (jpg, png) and videos (mp4, webm, mov, max 40MB).
- **Reporting**: Circular graphs using Matplotlib and CSV export.
- **Email**: Asynchronous email sending via aiosmtplib.
- **API Endpoints**: Robust set of API endpoints for authentication, statistics, agenda, programs, visitors, units, AI metrics, full CRUD operations for calendar, classes, attendance, and exercise library management (CRUD + file uploads).
- **Security**: All sensitive endpoints protected with JWT authentication.

### Feature Specifications
- **Comprehensive Calendar System**: CRUD for events, filtering, reminders, and completion tracking.
- **Weekly Calendar Planner**: Interactive grid, one-click event creation, large modal with 7-section navigation, week navigation, CRUD operations, advanced filtering, timezone-safe date handling, color-coded class blocks, responsive design.
- **Training Program Builder**: Program creation modal, multi-session support with drag-and-drop, real-time statistics, localStorage persistence with API fallback, grid display.
- **Exercise Library System**: Complete CRUD for exercises, 3-screen workflow (Library grid → Quick creation modal → Full editor), file upload system, search, filter, favorite, and hide functionality.
- **Class Scheduling & Booking**: Management of classes with instructors, rooms, capacity, recurrence, and booking/cancellation.
- **Automation**: Implementation of an "Automação" section with sub-tabs for Journeys, Questionnaires, Groups, and Activities, featuring a responsive grid for automation cards and status badges.
- **Workflow Builder**: Professional drag-and-drop visual workflow builder inspired by Zapier/Make/n8n with 80/20 canvas/sidebar layout for maximum workspace. Features: START/END nodes (green, protected, auto-created), SVG-based Bézier connections with rubber band visual, snap-to-port (30px threshold), port highlighting with glow effects, connection validation (prevents cycles using DFS, multiple inputs, self-connections), hover effects on edges, click-to-delete connections, mini toolbar on nodes (Edit/Duplicate/Delete), node selection, deep-clone duplication, zoom/pan controls, localStorage persistence keyed by journeyId. **Nested Sidebar System**: Click + button between elements to open nested sidebar with 14 trigger types (Aula reservada, Ausência, App VIVIO, Conta VIVIO, Serviço realizado, Sessões, Tarefa a fazer, Tarefa concluída, Tempo, Assinatura ativa/cancelada, Meta atingida, Treino completado, Avaliação física). Node insertion automatically reconnects edges (source→new→target). Includes 8 node types: 3 REGRAS (Aguardar, Condição, Sair), 5 AÇÕES (Tarefa, Enviar mensagem, E-mail, Questionário, Tipo de contato).
- **Engagement Metrics**: Tracking engagement rates, ROI, productivity, and churn risk for AI optimization.

## External Dependencies
- **Backend Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **Database ORM**: SQLAlchemy
- **Authentication**: PyJWT
- **Password Hashing**: Argon2, Passlib
- **Charting**: Matplotlib
- **Email Client**: aiosmtplib
- **Reporting/PDF**: ReportLab
- **Frontend Icons**: Font Awesome