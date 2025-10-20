# Myvivio CRM - Gym & Corporate Wellness

## Overview
Myvivio CRM is an intelligent management system designed for gyms and corporate wellness programs. It focuses on AI-driven optimization to enhance engagement, return on investment (ROI), and productivity. The system provides comprehensive tools for managing users, programs, schedules, and facilities, with a strong emphasis on data-driven insights and a modern user experience. Its primary goal is to serve as a unified platform for wellness businesses, offering features ranging from detailed attendance tracking to advanced analytics and automated communication.

## Recent Changes
- **October 20, 2025**: **REFINAMENTO VISUAL DO TOGGLE E SIDEBAR** (Aprovado pelo Arquiteto):
  - Botão toggle agora é completamente circular (border-radius: 50%)
  - Contorno azul suave (2px solid var(--accent-blue)) mantido em todos os estados
  - Hover mantém a borda azul e o ícone azul (não muda mais de cor)
  - Borda azul forte (2px solid) separando sidebar do conteúdo principal
  - Breadcrumb toggle com contorno mais fino (1px) conforme design de referência
  - Visual totalmente alinhado com as imagens de referência do Technogym
- **October 20, 2025**: **SIDEBAR COLAPSÁVEL MOVIDA PARA ESQUERDA** (Aprovado pelo Arquiteto):
  - Unified sidebar reposicionada do lado direito para o lado esquerdo da tela
  - CSS: Alterada posição de `right: 0` para `left: 0`
  - CSS: Border alterado de `border-left` para `border-right`
  - CSS: Sombra invertida de `-2px` para `2px` (projeta para direita)
  - CSS: Menu items com `border-right` ao invés de `border-left` para indicador ativo
  - JavaScript: Ícones do toggle invertidos (chevron-right quando collapsed, chevron-left quando expandida)
  - Sidebar ocupa altura completa (100vh) do topo ao rodapé
  - Animações de toggle mantidas funcionando perfeitamente com nova orientação
- **October 20, 2025**: **BREADCRUMB COM BOTÃO DE TOGGLE ADICIONADO**:
  - Adicionado botão de toggle no breadcrumb do builder de programa
  - Botão posicionado antes da palavra "Treinamento" no breadcrumb
  - Estrutura do breadcrumb: [botão voltar] [botão toggle] Treinamento > Fichas > [nome do programa] > Nível 1
  - Botão chama a função `toggleUnifiedSidebar()` existente
  - Estilo CSS `.breadcrumb-toggle` criado com dimensões 36x36px, borda azul accent, e efeito hover
  - Mantida toda a estrutura anterior (collapsible, rodapé, funções) sem alterações
- **October 20, 2025**: **OTIMIZAÇÃO DO LAYOUT DA SIDEBAR**:
  - Reduzida largura da sidebar de navegação de 250px para 180px (ajustada ao tamanho da maior palavra)
  - Reduzido padding da `.logo-section` de 1rem para 0.5rem
  - Reduzido padding do `.logo-placeholder` de 1.5rem 0.75rem para 1rem 0.5rem
  - Ajustado `margin-left` do `.main-content` de 250px para 180px
  - Layout mais compacto e com melhor aproveitamento de espaço horizontal
  - Media queries atualizados para manter consistência em todas as resoluções
- **October 19, 2025**: **SISTEMA DE MÚLTIPLAS SESSÕES COMPLETO** (Aprovado pelo Arquiteto):
  - Implementado sistema de tabs clicáveis para navegação entre sessões (`renderizarTabsSessoes()`)
  - Cada tab mostra nome da sessão + contador de exercícios atualizado em tempo real
  - Tab ativa destacada com fundo azul (#62b1ca) e texto branco
  - Função `selecionarSessao()` permite trocar entre sessões com um clique
  - Estatísticas corrigidas: agora calculam de `sessao.exercicios` (min, kcal, count)
  - Botão EXPANDIR: esconde biblioteca, filtros e tabs - sessão ocupa tela inteira
  - Modo expandido mostra "+ EXERCÍCIOS" para retornar ao modo normal
  - Menu de 3 pontos por sessão: Renomear, Clonar, Excluir com validações
  - Botão "+ Adicionar Sessão" cria novas sessões com ID incremental
  - Clone profundo de sessões preserva todos os exercícios independentemente
  - Todas as operações atualizam tabs e estatísticas automaticamente
  - Validação de salvamento: exige pelo menos 1 exercício em qualquer sessão
  - Sistema salva todas as sessões em `programaData.sessoes` com estrutura completa
- **October 19, 2025**: **CORREÇÕES CRÍTICAS NO SISTEMA DE PROGRAMAS**:
  - Corrigido erro de função inexistente: `mostrarToast` → `showToast` (todas as ocorrências)
  - Corrigida visibilidade da página Programas: agora só aparece ao navegar para TAB Treinamento
  - Forçado controle explícito de display (none/block) nas funções navigateTo e navigateToPage
  - Programas salvos agora aparecem corretamente na lista após criação
  - Sistema totalmente funcional sem erros no console
- **October 19, 2025**: **COMPLETE TRAINING PROGRAM MANAGEMENT SYSTEM**:
  - Created "Programas" page with program creation modal (name, goal type, objective, exercise type, access permissions)
  - Built comprehensive program builder with exercise library (8 initial exercises with metadata)
  - Implemented filtering system (equipment type, quality, body part, movement type)
  - Created session management with drag-and-drop functionality
  - Added real-time statistics (exercise count, duration, calories)
  - Implemented localStorage persistence with API fallback for hybrid online/offline usage
  - Added state cleanup between program creations to prevent stale data
  - Validation requires minimum 1 exercise before saving
  - Programs display in grid with exercise count, date, and category tags
  - Empty state with friendly message when no programs exist
  - Smooth transitions and professional UI matching Technogym aesthetic
- **October 18, 2025**: **MAJOR REFACTOR** - Unified sidebar converted to overlay system:
  - Sidebar now appears OVER the main content (z-index 900) instead of pushing it aside
  - When hidden, shows only a small 40x40px button in accent blue (#62b1ca) positioned at top-right (20px from edges)
  - Hidden state completely hides sidebar content (header and menu items) - only toggle button visible
  - No margin adjustments to main-content - pure overlay behavior
  - Smooth transitions between hidden → expanded → collapsed states
- **October 18, 2025**: Sidebar collapsed state refined - when recolhida, esconde completamente mostrando apenas o botão de toggle (40x40px)
- **October 18, 2025**: Dynamic button positioning implemented:
  - Button position calculated using getBoundingClientRect to align with breadcrumb
  - Event listeners for resize, orientationchange, and scroll maintain alignment
  - Debounced updates (50ms) for performance
  - Double requestAnimationFrame ensures layout is rendered before positioning
  - CSS custom property --sidebar-button-top with 80px fallback
- **October 18, 2025**: Visual refinement of sidebar toggle button:
  - Reduced size from 40x40px to 32x32px
  - Removed background fill (now transparent with 2px border)
  - Border color matches accent blue (#62b1ca)
  - Subtle hover effect with light background tint
  - Positioned 20px from right edge, aligned with breadcrumb
- **October 18, 2025**: Fixed sidebar toggle button positioning:
  - Button now uses position: fixed in ALL states (expanded, collapsed, hidden)
  - Always positioned at top-right corner (right: 20px, aligned with breadcrumb)
  - Consistent 32x32px size and transparent style across all states
  - z-index: 1000 ensures button stays above sidebar content
  - Eliminated the issue where button appeared on sidebar edge when expanded
- **October 18, 2025**: **MAJOR REFACTOR** - Implemented unified collapsible sidebar system:
  - Replaced individual sidebars (planner-sidebar, pessoas-drawer) with a single dynamic unified-sidebar
  - Sidebar content updates automatically based on active main tab (Planejador, Pessoas, Treinamento)
  - Single toggle button with smooth collapse/expand animation
  - Consolidated CSS and JavaScript for better maintainability
- **October 18, 2025**: Implemented Hidden Drawer Sidebar for Pessoas page with 3 tabs (Contatos, Membros da Equipe, Suporte Vivio)
- **October 18, 2025**: Created Contatos page with Technogym-inspired table design, filtering, and sorting capabilities
- **October 18, 2025**: Added toggle functionality to show/hide Pessoas sidebar with smooth animations
- **October 18, 2025**: Optimized breadcrumb styling for Planejador and main pages (inline-block, 20px margins, harmonized with navigation font sizes)
- **October 18, 2025**: Reduced logo section padding for better visual harmony (1.5rem → 1rem padding, logo text 1.3rem → 1.1rem)
- **October 18, 2025**: Adjusted font sizes across application (moderate reduction of ~10% for better space/readability balance)
- **October 18, 2025**: Connected weekly calendar event cards to info modal with complete participant data (added sem_1, sem_2, sem_3 to mockData.aulasDetalhes)

## User Preferences
I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`. I want iterative development. I prefer simple language. I like functional programming. Ask before making major changes.

## System Architecture
The Myvivio CRM features a full-stack architecture with a FastAPI backend and a vanilla HTML, CSS, and JavaScript frontend, designed as a Single Page Application (SPA).

### UI/UX Decisions
- **Branding**: Full rebranding to "Myvivio CRM" with a professional aesthetic inspired by Technogym.
- **Color Palette**: Utilizes a consistent professional palette: Accent Blue (#62b1ca), Dark Blue (#1f2746), Medium Blue (#333f6e), White (#ffffff), Black (#000000). Specific colors for warnings, success, and danger are also defined.
- **Iconography**: Exclusively uses Font Awesome 6.4.0 icons for a professional look, replacing all emojis.
- **Layout**: Features a fixed left-hand navigation sidebar with 6 main pages (Home, Planejador, Pessoas, Treinamento, Relatórios, Configurações) and a dynamic, collapsable unified sidebar on the right that adapts content based on active page.
- **Dashboard**: The Home dashboard is tab-based, offering "Day-to-day" and "Performance" views with widgets and metrics.
- **Interactivity**: Includes a dynamic calendar, quick event creation, interactive sidebar elements with smooth animations, and toast notifications for user feedback.
- **Responsiveness**: Designed to be responsive, with the sidebar adapting to full width on mobile.

### Technical Implementations
- **Backend Framework**: FastAPI for high performance and ease of use.
- **Frontend**: HTML5, CSS3, and vanilla JavaScript for a lightweight and customizable client-side experience.
- **Database**: SQLAlchemy ORM with SQLite for development, designed for easy migration to PostgreSQL in production.
- **Authentication**: JWT-based authentication using PyJWT and HTTPBearer, with Argon2 for secure password hashing.
- **Data Models**: Comprehensive data models for managing `Unidade` (units), `Usuario` (users), `Visitante` (leads), `Programa`, `Sala` (rooms), `Instrutor` (instructors), `EventoCalendario` (calendar events), `EventoAula` (class events), `ReservaAula` (class bookings), and a critical `Attendance` model.
- **Attendance System**: A unique "Single Source of Truth" attendance system with validated statuses (presente, falta, justificada), complete metadata, and a unique database constraint (`idx_unique_attendance_reserva`) to prevent duplicates. Includes automatic cleanup and a `DELETE+INSERT` pattern for integrity.
- **Reporting**: Generation of circular graphs using Matplotlib for occupancy and attendance statistics, and CSV export functionality for various reports.
- **Email**: Asynchronous email sending capabilities via aiosmtplib.
- **API Endpoints**: A robust set of API endpoints for authentication, statistics, agenda management, programs, visitors, units, AI metrics, and full CRUD operations for the new calendar, classes, and attendance systems.
- **Security**: All sensitive endpoints are protected with JWT authentication. Public endpoints are clearly defined.

### Feature Specifications
- **Comprehensive Calendar System**: CRUD operations for events, filtering, reminders, and completion tracking.
- **Weekly Calendar Planner** (October 2025):
  - Interactive grid with 7 days × 17 time slots (6h-22h)
  - One-click event creation with pre-filled date/time
  - Large modal (1000px) with 7-section sidebar navigation (Basic Info, Schedule, Instructor, Room, Participants, Recurrence, Notes)
  - Week navigation (previous/next/today) with real-time header updates
  - CRUD operations (create, edit, delete) with validations
  - Advanced filtering by class type, room, instructor
  - Timezone-safe date handling using `formatarDataLocal()` function (eliminates UTC offset issues)
  - Color-coded class blocks by type with hover effects
  - Responsive design (desktop/tablet/mobile)
- **Class Scheduling & Booking**: Management of classes with instructors, rooms, capacity limits, recurrence, and a full booking/cancellation system.
- **Engagement Metrics**: Tracking of engagement rates, ROI, productivity indices, and prediction of churn risk, all structured for AI optimization.
- **Admin Tools**: Endpoint for manual attendance duplicate cleanup (`/admin/attendance/limpar-duplicatas`).

## External Dependencies
- **Backend Framework**: FastAPI (0.118.2)
- **ASGI Server**: Uvicorn (0.37.0)
- **Database ORM**: SQLAlchemy (2.0.43)
- **Authentication**: PyJWT (2.10.1)
- **Password Hashing**: Argon2 (argon2-cffi 25.1.0) and Passlib (1.7.4)
- **Charting**: Matplotlib (3.10.7)
- **Email Client**: aiosmtplib (4.0.2)
- **Reporting/PDF**: ReportLab (4.4.4)
- **Frontend Icons**: Font Awesome (6.4.0)