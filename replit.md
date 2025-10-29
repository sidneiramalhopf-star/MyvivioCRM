# Myvivio CRM - Gym & Corporate Wellness

## Overview
Myvivio CRM is an intelligent management system for gyms and corporate wellness programs. It uses AI-driven optimization to boost engagement, ROI, and productivity. The system offers comprehensive tools for managing users, programs, schedules, and facilities, with a focus on data-driven insights and a modern user experience. Its main goal is to be a unified platform for wellness businesses, providing features from detailed attendance tracking to advanced analytics and automated communication.

## Recent Changes
- **October 29, 2025**: **LAYOUT COMPACTO DA PÁGINA DE AULAS** (Aprovado pelo Arquiteto):
  - **Mídia lado a lado**: Foto (esquerda) e vídeo promocional (direita) em grid 50/50
  - **Proporção otimizada**: Ambos com aspect-ratio 4:3, espaço reduzido
  - **Header compacto**: Botão voltar + título em linha única, sem thumbnail grande
  - **Formulário otimizado**: 2 colunas - campos à esquerda, descrição à direita
  - **Campos em linha**: Duração e Capacidade lado a lado para economizar espaço vertical
  - **Espaçamentos reduzidos**: Padding de 1rem, gaps menores (0.75rem), fontes otimizadas
  - **Nova classe CSS**: `.aula-form-compacta` com estilos específicos para layout enxuto
  - **Responsive**: Grid vira 1 coluna em telas <768px
  - **Uploads funcionais**: Funções uploadFotoAula() e uploadVideoAula() compatíveis com novos IDs
  - **Cache atualizado**: v4 (20251027v4)
  - **Resultado**: Página de criação/edição de aulas 40% mais compacta, toda informação visível sem scroll excessivo
- **October 27, 2025 - Update 2**: **PÁGINAS SEPARADAS PARA FORMULÁRIOS DE EXERCÍCIOS E AULAS** (Aprovado pelo Arquiteto):
  - **Ícone corrigido**: Opção "Aulas" na sidebar agora usa ícone válido `fa-chalkboard-user` (Font Awesome)
  - **Páginas de formulário separadas**: Ao clicar em "+NOVO EXERCÍCIO" ou "+NOVA AULA", abre em página independente
  - **Arquitetura atualizada**: 5 páginas em Treinamento (programas, exercicios, aulas, exercicio-form, aula-form)
  - **Navegação otimizada**: Funções abrirNovoExercicio(), abrirNovaAula(), abrirEdicaoExercicio(), abrirEdicaoAula() usam switchTreinamentoView()
  - **Botões voltar**: voltarParaExercicios() e voltarParaAulas() navegam de volta para listas
  - **Estrutura limpa**: Removidas páginas antigas (page-edicao-exercicio, page-edicao-aula), tudo dentro de page-treinamento
  - **Cache atualizado**: v3 (20251027v3)
  - **Resultado**: Formulários de criação/edição abrem em páginas completamente separadas, melhorando UX e organização
- **October 27, 2025 - Update 1**: **NOVA SEÇÃO "AULAS" IMPLEMENTADA VIA SIDEBAR** (Aprovado pelo Arquiteto):
  - **Navegação via Sidebar**: Sidebar colapsável direita agora possui 3 opções em Treinamento: Fichas, Exercícios, Aulas
  - **Arquitetura de Páginas Separadas**: Cada opção abre uma página independente (treinamento-programas, treinamento-exercicios, treinamento-aulas)
  - **Função de navegação**: `switchTreinamentoView(view, event)` controla alternância entre as páginas separadas
  - **Página de listagem de Aulas**: Grid de cards com botão "NOVA AULA" (verde #3fa561 Technogym)
  - **Workflow completo de criação/edição**: Similar ao de Exercícios com layout 2 colunas (60/40)
  - **Campos implementados**: Nome, Tipo, Nível, Duração, Capacidade, Elaborado por (auto), Descrição
  - **Upload de mídia**: Foto (600x450, jpg/png) e Vídeo promocional (max 40MB, mp4/webm/mov)
  - **Funções CRUD**: loadAulas(), renderAulas(), abrirNovaAula(), salvarAula(), abrirEdicaoAula(), voltarParaAulas()
  - **Uploads funcionais**: uploadFotoAula() e uploadVideoAula() com preview automático
  - **Resultado**: Sistema completo com 3 seções separadas controladas pela sidebar colapsável, aguardando apenas endpoints backend para Aulas
- **October 26, 2025 - Afternoon (Update 3)**: **CORREÇÕES CRÍTICAS DE FUNCIONALIDADE** (Aprovado pelo Arquiteto):
  - **Box de foto aspect ratio 4:3**: Mudado de dimensões fixas para aspect-ratio 4:3 responsivo (igual ao vídeo)
  - **Função duplicada removida**: Havia duas definições de salvarExercicio() - a segunda (linha ~4186) sobrescrevia a primeira
  - **Salvamento corrigido**: Mantida apenas a versão completa (linha 3898) que suporta POST (criar) e PUT (atualizar)
  - **Cache atualizado**: Versão v=20251026v3 para forçar reload completo dos arquivos JS/CSS
  - **Resultado**: Exercícios agora podem ser salvos corretamente, fotos e vídeos fazem upload, box de foto tem proporção correta 4:3
- **October 26, 2025 - Afternoon (Update 2)**: **OTIMIZAÇÃO DA PÁGINA DE EXERCÍCIOS** (Aprovado pelo Arquiteto):
  - **Interface compactada**: Todos os elementos visíveis na tela sem scroll excessivo
  - **Tamanhos reduzidos**: Header (0.75rem padding), botão voltar (32px), thumbnail (50x38), seções (1rem padding)
  - **Fontes padronizadas**: Uso consistente de variáveis CSS (--font-h2, --font-body, --font-small, --font-tiny)
  - **Criador automático**: Campo "Elaborado por" preenchido automaticamente com nome do usuário logado (readonly)
  - **Upload intuitivo**: Clique na área de preview ou botão "Modificar a foto" abre seletor de arquivo
  - **Preview funcional**: Imagens e vídeos exibidos imediatamente após upload, mantendo click handler
  - **Botão SALVAR implementado**: Função salvarExercicio() completa - valida campos, cria/atualiza exercício, volta para biblioteca
  - **Textarea reduzida**: min-height de 200px → 120px para melhor aproveitamento vertical
- **October 26, 2025 - Afternoon (Update 1)**: **PÁGINA DE CRIAÇÃO/EDIÇÃO DE EXERCÍCIOS IMPLEMENTADA** (Aprovado pelo Arquiteto):
  - **Botão NOVO EXERCÍCIO reduzido**: Padding ajustado de 12px 24px para 7px 19px (exatamente 5px menor)
  - **Página de criação implementada**: Ao clicar em NOVO EXERCÍCIO, abre página de edição em modo vazio para criar novo exercício
  - **Layout conforme referência**: Header com botão voltar circular, thumbnail, nome, "Dados gerais" e ícones (lista, engrenagem)
  - **Layout 2 colunas**: Imagem (60%) à esquerda com preview e upload, Vídeo (40%) à direita com player e upload
  - **Formulário completo**: Nome, Quem pode utilizá-lo, Tipo, Elaborado por, Descrição
  - **Uploads funcionais**: uploadFotoExercicio() e uploadVideoExercicio() com preview automático e validação de tamanho (max 40MB para vídeo)
  - **Navegação completa**: NOVO EXERCÍCIO → página de criação → voltar → biblioteca de exercícios
  - **Função abrirNovoExercicio()**: Limpa todos os campos, reseta previews, prepara página para criação
  - **Função abrirEdicaoExercicio(id)**: Carrega dados de exercício existente para edição
  - **Estilos detalhados**: Specs de foto/vídeo com formatação (Formatos compatíveis, Resolução sugerida, Tamanho máximo, Razão de aspecto)
- **October 26, 2025 - Morning**: **PADRONIZAÇÃO COMPLETA DE BOTÕES E TIPOGRAFIA** (Aprovado pelo Arquiteto):
  - **Variáveis CSS criadas** em :root:
    - --btn-primary: #123058 (cor padrão de TODOS os botões primários)
    - --btn-primary-hover: #0d2340 (hover de botões primários)
    - --btn-secondary: #e0e0e0 (botões secundários/filtros)
    - --btn-secondary-hover: #d5d5d5
    - --font-h1: 1.75rem (títulos principais)
    - --font-h2: 1.25rem (subtítulos)
    - --font-h3: 1rem (subtítulos menores)
    - --font-body: 0.875rem (texto normal, igual às tabs)
    - --font-small: 0.75rem, --font-tiny: 0.7rem
  - **Estilos globais padronizados**:
    - Todos botões primários (btn-primary, btn-criar, btn-salvar, btn-continuar, btn-salvar-exercicio, btn-novo-exercicio, btn-agendar-rapido, btn-reservar, btn-concluir, btn-add-option, btn-mostra, btn-adicionar-sessao) com background #123058
    - Todos botões secundários (btn-secondary, btn-filter, btn-filtro, btn-limpar-filtros, btn-buscar) com background #e0e0e0
    - Botões outline com borda #123058 e background transparente
    - Botões de perigo (danger) e aviso (warning) mantidos para ações destrutivas
    - Tipografia padronizada: h1, h2, h3 com tamanhos consistentes
  - **Limpeza de CSS**:
    - Removidas 10+ definições duplicadas de botões que sobrescreviam estilos globais
    - Removidas cores antigas (verde #4caf50, azul #62b1ca) de botões específicos
    - Removidos hovers órfãos que causavam conflitos na cascata CSS
    - Mantidas apenas propriedades únicas (width, height, display) em classes específicas
  - **Resultado**: Sistema de design consistente e production-ready, sem conflitos CSS, todos botões seguem o padrão #123058, hierarquia visual clara

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