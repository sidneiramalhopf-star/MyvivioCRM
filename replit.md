# Myvivio CRM - Gym & Corporate Wellness

## Overview
Myvivio CRM is an intelligent management system for gyms and corporate wellness programs. It leverages AI-driven optimization to enhance engagement, ROI, and productivity. The platform offers comprehensive tools for managing users, programs, schedules, and facilities, with a strong emphasis on data-driven insights and a modern user experience. Its primary goal is to serve as a unified platform for wellness businesses, providing features from detailed attendance tracking to advanced analytics and automated communication.

## User Preferences
I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`. I want iterative development. I prefer simple language. I like functional programming. Ask before making major changes.

## System Architecture
The Myvivio CRM employs a full-stack architecture, featuring a FastAPI backend and a vanilla HTML, CSS, and JavaScript frontend, implemented as a Single Page Application (SPA).

### UI/UX Decisions
- **Branding**: Professional aesthetic inspired by VIVIO wellness platforms, with the VIVIO logo prominently displayed.
- **Color Palette**: Professional palette including Accent Blue (#62b1ca), Dark Blue (#1f2746), Medium Blue (#333f6e), White, and Black.
- **Iconography**: Exclusively uses Font Awesome 6.4.0 icons.
- **Layout**: Fixed left-hand navigation sidebar (180px) and a dynamic, collapsible unified right sidebar. Top header is 95px high.
- **Dashboard**: Tab-based Home dashboard with "Day-to-day" and "Performance" views.
- **Interactivity**: Dynamic calendar, quick event creation, interactive sidebar elements with animations, and toast notifications.
- **Responsiveness**: Designed to be responsive, with the sidebar adapting on mobile.
- **Workflow Builder**: Maximized canvas area with a bottom-left floating toolbar, mouse wheel zoom support, and a clean professional interface following Zapier/Make/n8n design patterns. Features START/END nodes, SVG-based connections with snap-to-port and validation (no cycles, single input), node mini-toolbar, zoom/pan, localStorage persistence, floating "+" buttons on edges for element insertion, and magnetic reconnection on node deletion. Nested sidebar for element configuration supports 14 trigger and 12 node types.

### Technical Implementations
- **Backend Framework**: FastAPI.
- **Frontend**: HTML5, CSS3, and vanilla JavaScript.
- **Database**: SQLAlchemy ORM with SQLite (development) and PostgreSQL (production).
- **Authentication**: JWT-based authentication using PyJWT and HTTPBearer, with Argon2 for secure password hashing.
- **Data Models**: Comprehensive models for managing units, users, visitors, programs, rooms, instructors, calendar events, classes, bookings, attendance, exercises, questionnaires, questions, options, groups, system events, journeys, journey steps, and user journey progress.
- **Machine Learning**: Integrated scikit-learn for churn prediction (Logistic Regression model) and lead scoring, with models stored in the database.
- **Attendance System**: "Single Source of Truth" attendance system with validated statuses and unique database constraints.
- **File Upload System**: Secure file upload for exercise photos (jpg, png) and videos (mp4, webm, mov, max 40MB).
- **Reporting**: Circular graphs using Matplotlib and CSV export with ML risk analysis.
- **Email**: Asynchronous email sending via aiosmtplib.
- **API Endpoints**: Robust set of API endpoints for authentication, statistics, agenda, programs, visitors, units, AI metrics, full CRUD operations for calendar, classes, attendance, exercise library, questionnaires, groups, ML/AI features (training, risk assessment, event processing), and Automated Journeys (CRUD, activation, deactivation, duplication, user progress, manual processing).
- **Security**: All sensitive endpoints protected with JWT authentication; admin-only access for ML/AI features.

### Feature Specifications
- **Comprehensive Calendar System**: CRUD for events, filtering, reminders, and completion tracking, including a weekly planner with interactive grid and one-click event creation.
- **Training Program Builder**: Program creation modal with multi-session support, drag-and-drop interface, real-time statistics, and persistence.
- **Exercise Library System**: Complete CRUD for exercises, 3-screen workflow, file upload, search, filter, favorite, and hide functionality.
- **Class Scheduling & Booking**: Management of classes with instructors, rooms, capacity, recurrence, and booking/cancellation.
- **Automation Section**: A dedicated "Automação" section with sub-tabs for Journeys, Questionnaires, Groups, and Activities, featuring a responsive grid for automation cards and status badges.
- **Questionnaire System**: Complete CRUD for questionnaires with template selection, status-based grouping, and card-based display. Supports multiple question types with configurable options and ordering.
- **Groups System**: Intelligent user segmentation system with AI-powered group suggestions, card-based display, visual statistics, automation integration, and full CRUD operations. Supports flexible JSON-based criteria for dynamic filtering.
- **Automated Customer Journeys**: Event-driven automation system enabling multi-step customer journeys triggered by user actions and ML predictions. Includes models for journey definitions, ordered workflow steps, and individual user progress tracking. Supports action types like email sending, task creation, group addition, and status changes.
- **Engagement Metrics**: Tracking engagement rates, ROI, productivity, and churn risk for AI optimization.

- **Configuration Tab Redesign (Dec 12, 2025)**: Transformed the static Configuration page into a modern tabbed interface with collapsible right sidebar (same pattern as Painel/Automação). Six subtabs: Loja (store products/categories/promotions), Aparelhos (gym equipment management), Dispositivos (tablets/access control), Customização (branding/colors/email templates), Unidade (location/hours), Assinaturas e Planos (subscription plan management). Each subtab displays modern card UI with icons and action buttons. CSS: ~100 lines for config-page, config-container, config-grid, config-card-new, btn-config styles.

- **Reports Panel (Dec 12, 2025)**: Comprehensive reports dashboard with 7 subtabs for data export. Frontend: New "Painel" menu item with collapsible right sidebar (same pattern as Automação), subtabs for Aulas, Automação, Loja, Equipe, Contratos, Visitantes, Financeiro. Each subtab has date filters, CSV/PDF download buttons, and real-time stats cards. Backend: 7 GET endpoints (/relatorios/aulas, /automacao, /loja, /equipe, /contratos, /visitantes, /financeiro) for data retrieval plus 1 download endpoint (/relatorios/{tipo}/download) supporting CSV and PDF formats using ReportLab. All endpoints require JWT authentication. CSS: ~250 lines for relatorio-container, filtros, buttons, stat-cards, and responsive design. JS: switchPainelView function, 7 async data loading functions, downloadRelatorio function with blob handling.

- **B2B Corporate Contracts System (Nov 23, 2025)**: Hybrid B2C/B2B platform expansion for managing corporate wellness contracts. Backend: Expanded `Unidade` model with `tipo_unidade` field (B2C/B2B), `Visitante` with `tipo_lead` (Individual/Corporativo) and `empresa` fields, new `Contrato` model with unidade_id, nome, data_inicio, data_fim, valor_mensal, limite_usuarios, status. Seven CRUD endpoints: GET/POST/PUT/DELETE `/contratos`, POST `/contratos/{id}/renovar` (automatic renewal with months parameter), GET `/contratos/expirados/lista` (contracts expiring within 30 days with dias_restantes and status_alerta). Event integration: CONTRATO_CRIADO and CONTRATO_RENOVADO events automatically registered. IA endpoint: GET `/admin/ia/riscos_renovacao` calculates non-renewal risk based on days remaining (CRITICO <15 days, ALTO <30 days, MEDIO), returns receita_mensal_em_risco, taxa_uso (active users/limit), aggregated metrics. Automation: "Renovação de Contrato Corporativo" journey with 4 steps (alerts at 60, 30, 15 days + commercial task). Frontend: "Contratos" menu item (fa-file-contract icon), responsive card grid with color-coded badges (green >30 days, yellow 15-30, red <15), modal for create/edit with validations, B2B dashboard with 4 KPIs (active contracts, total monthly revenue, expiring contracts, average renewal rate), functions: loadContratos(), salvarContrato(), deletarContrato(), renovarContrato(). Migration: `migrar_schema_b2b_startup()` function automatically adds tipo_unidade/tipo_lead/empresa columns at startup, ensuring backward compatibility. Data population: `popular_contratos_exemplo.py` creates 3 sample corporate contracts with varying expiration dates. Security: Admin-only access (get_admin_user) for contract management, JWT protection on all endpoints, multi-tenant isolation via unidade_id. Designed for corporate wellness programs with user limits, revenue tracking, and automated renewal workflows.

## Backend Integration Status (Dec 13, 2025)

### Fully Connected to Backend (Real Data)
- **Authentication**: Login/register with JWT, session management
- **Dashboard Home**: Stats overview, IA metrics, day-to-day timeline
- **Pessoas (Contacts)**: Full CRUD for visitantes
- **Contratos**: Full CRUD for B2B contracts with renewal workflow
- **Programas de Treinamento**: Create/list programs via POST/GET /programas
- **Automação - Jornadas**: Full CRUD for customer journeys
- **Automação - Questionários**: Full CRUD for questionnaires
- **Automação - Grupos**: Full CRUD for user groups
- **Reports Panel**: 7 report endpoints for aulas, automacao, loja, equipe, contratos, visitantes, financeiro

### Still Using Mock Data (Future Enhancement)
- **Weekly Class Planner**: Uses mockData.aulasSemanais for class grid display
- **Class Details with Attendance**: Uses mockData.aulasDetalhes for inscritos list
- **Penalties System**: Uses mockData.penalidades for user faults
- **Configuration Section**: Loja, Aparelhos, Dispositivos, Customização, Unidade, Assinaturas (UI cards only, no backend endpoints)
- **Form Dropdowns**: Types, instructors, modes for class creation

### Access Credentials
- **Admin**: admin@vivio.com / admin123

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
- **Machine Learning**: pandas, scikit-learn