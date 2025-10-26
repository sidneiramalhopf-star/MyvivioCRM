# Myvivio CRM - Gym & Corporate Wellness

## Overview
Myvivio CRM is an intelligent management system for gyms and corporate wellness programs. It uses AI-driven optimization to boost engagement, ROI, and productivity. The system offers comprehensive tools for managing users, programs, schedules, and facilities, with a focus on data-driven insights and a modern user experience. Its main goal is to be a unified platform for wellness businesses, providing features from detailed attendance tracking to advanced analytics and automated communication.

## User Preferences
I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`. I want iterative development. I prefer simple language. I like functional programming. Ask before making major changes.

## System Architecture
The Myvivio CRM features a full-stack architecture with a FastAPI backend and a vanilla HTML, CSS, and JavaScript frontend, designed as a Single Page Application (SPA).

### UI/UX Decisions
- **Branding**: "Myvivio CRM" with a professional aesthetic inspired by Technogym.
- **Color Palette**: Professional palette: Accent Blue (#62b1ca), Dark Blue (#1f2746), Medium Blue (#333f6e), White (#ffffff), Black (#000000).
- **Iconography**: Exclusively uses Font Awesome 6.4.0 icons.
- **Layout**: Fixed left-hand navigation sidebar (6 main pages) and a dynamic, collapsible unified sidebar on the right that adapts content based on the active page.
- **Dashboard**: Tab-based Home dashboard with "Day-to-day" and "Performance" views.
- **Interactivity**: Dynamic calendar, quick event creation, interactive sidebar elements with animations, and toast notifications.
- **Responsiveness**: Designed to be responsive, with the sidebar adapting to full width on mobile.

### Technical Implementations
- **Backend Framework**: FastAPI.
- **Frontend**: HTML5, CSS3, and vanilla JavaScript.
- **Database**: SQLAlchemy ORM with SQLite for development, designed for easy migration to PostgreSQL.
- **Authentication**: JWT-based authentication using PyJWT and HTTPBearer, with Argon2 for secure password hashing.
- **Data Models**: Comprehensive models for `Unidade`, `Usuario`, `Visitante`, `Programa`, `Sala`, `Instrutor`, `EventoCalendario`, `EventoAula`, `ReservaAula`, `Attendance`, and `Exercicio`.
- **Exercicio Model**: Complete exercise management with fields like name, type, usage permissions, description, media URLs, and timestamps.
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
- **Engagement Metrics**: Tracking engagement rates, ROI, productivity, and churn risk for AI optimization.
- **Admin Tools**: Endpoint for manual attendance duplicate cleanup.

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