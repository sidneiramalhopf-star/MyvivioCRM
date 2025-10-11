# Myvivio CRM - Gym & Corporate Wellness

## Visão Geral
Sistema de gestão inteligente para academias e wellness corporativo, com foco em otimização por IA de engajamento, ROI e produtividade.

## Mudanças Recentes

### 11/10/2025 - Melhorias UX/UI no Frontend

#### Calendário Interativo e Criação Rápida de Eventos
- **Mês/Ano Dinâmico**: Display de mês e ano atualizado em tempo real na navegação do calendário
- **Criação com 1 Clique**: Clicar em qualquer data do calendário abre modal de criação de evento automaticamente
- **Botão "+" Quick Add**: Botão circular azul (#62b1ca) ao lado do título "Calendário" para criar eventos instantaneamente
- **Modal de Evento Completo**: 
  - Formulário com campos: título, data (pré-preenchida), hora início/fim, tipo de evento, descrição
  - Checkbox para ativar lembrete
  - Integração com backend via `/calendario/eventos/criar`
  - Validação e feedback visual com toast notifications

#### Barra Lateral Global do Planejador
- **Disponível em TODAS as Tabs**: Sidebar acessível em qualquer página do sistema
- **Botão Flutuante Lateral**: 
  - Posição fixa no lado direito da tela (50% altura)
  - Cor: #62b1ca com sombra e hover effects
  - Ícone Font Awesome calendário
  - Visível até na tela de login
- **Conteúdo da Sidebar**:
  - **Mini Calendário**: Visualização compacta do mês atual com navegação
  - **Estatísticas de Reservas**: Cards com aulas agendadas e % de ocupação
  - **Próximas Atividades**: Lista das atividades mais próximas
- **UX/Interação**:
  - Slide animation suave (transform translateX)
  - Fecha automaticamente ao clicar fora
  - Header fixo com botão de fechar
  - Scroll interno para conteúdo longo
  - Responsive: 100% da largura em mobile

#### Melhorias de Código
- Event listeners registrados corretamente no `setupEventListeners()`
- Funções de navegação do calendário atualizadas para manter sincronização
- Cache busting: CSS e JS com versão atualizada (v20251011v1)
- Código modular e reutilizável para futuras expansões

### 10/10/2025 - Expansão do Backend - Sistema Completo de Calendário e Aulas
- **Novos Modelos de Dados**: Sala, Instrutor, EventoCalendario, EventoAula, ReservaAula, **Attendance**
- **Sistema de Calendário**: CRUD completo com filtros, lembretes e marcação de conclusão
- **Sistema de Aulas**: Agendamento de aulas com instrutores, salas e limite de inscrições
- **Reservas de Aulas**: Sistema completo de reservas, cancelamento e controle de presença
- **Sistema Attendance (Presença Autoritativa)**:
  - **Única Fonte de Verdade**: Todas estatísticas e gráficos usam SOMENTE Attendance
  - **Constraint Único no Banco**: `idx_unique_attendance_reserva` garante 1 registro por reserva
  - **3 Status Validados**: presente, falta, justificada (com metadados completos)
  - **Limpeza Automática**: Remove duplicatas na inicialização antes de criar constraint
  - **DELETE+INSERT**: Garante unicidade em tempo de execução
  - **Endpoint Admin**: `/admin/attendance/limpar-duplicatas` para manutenção manual
- **E-mail em Massa**: Envio de e-mails para todos inscritos em uma aula (SMTP configurável)
- **Gráficos Circulares**: Geração automática de gráficos com matplotlib (ocupação, presença, faltas)
- **Exportação de Relatórios**: Exportação CSV de calendário e aulas com filtros de data
- **Estatísticas Avançadas**: Métricas detalhadas de ocupação, presença e performance

### Interface e Design
- **Rebranding completo para Myvivio CRM**: Nome da marca atualizado em toda a interface
- **Nova paleta de cores**: Implementada paleta profissional (#62b1ca, #1f2746, #333f6e, #ffffff, #000000)
- **Ícones profissionais**: Todos os emojis substituídos por ícones Font Awesome
- **Home Dashboard com abas**:
  - **Aba "Dia após dia"**: Timeline de atividades, widgets de contatos, leads e programas
  - **Aba "Desempenho"**: Métricas de retenção, usuários, ROI, engajamento e produtividade
- **Busca personalizada**: "Buscar no Myvivio CRM"
- **Layout Technogym**: Sidebar de navegação esquerda fixa com 6 páginas
- **Planejador Avançado**: Sidebar colapsável com 3 seções (Calendário, Reservas, Agendamento)
- **Segurança reforçada**: Todos os endpoints sensíveis protegidos com autenticação JWT
- **Autenticação moderna**: Login/registro com JSON body (não query params) e Argon2 hash

## Tecnologias

### Backend
- **Framework**: FastAPI 0.118.2
- **Servidor**: Uvicorn 0.37.0
- **Banco de Dados**: SQLite + SQLAlchemy 2.0.43
- **Autenticação**: JWT (PyJWT 2.10.1) + HTTPBearer
- **Segurança**: Argon2 (argon2-cffi 25.1.0) + Passlib 1.7.4
- **Gráficos**: Matplotlib 3.10.7 (gráficos circulares de ocupação)
- **E-mail**: aiosmtplib 4.0.2 (envio assíncrono de e-mails)
- **Relatórios**: ReportLab 4.4.4 + CSV (exportação de dados)
- **Linguagem**: Python 3.11

### Frontend
- **HTML5 + CSS3 + JavaScript Vanilla**
- **Design**: Layout inspirado em CRM Technogym com sidebar de navegação
- **Paleta de Cores**:
  - **Accent Blue**: #62b1ca (botões, destaques, links)
  - **Dark Blue**: #1f2746 (sidebar, cabeçalhos)
  - **Medium Blue**: #333f6e (backgrounds secundários)
  - **White**: #ffffff (textos primários, backgrounds)
  - **Black**: #000000 (textos, ícones)
  - **Warning**: #f39c12 (alertas, programas expirados)
  - **Success**: #27ae60 (confirmações)
  - **Danger**: #e74c3c (apenas toasts de erro do sistema)
- **Ícones**: Font Awesome 6.4.0 (totalmente substituindo emojis)
- **Navegação**: 6 páginas principais com ícones profissionais

## Estrutura do Projeto

```
.
├── metavida_app.py          # Backend FastAPI
├── gym_wellness.db          # Banco SQLite (gerado automaticamente)
├── templates/
│   └── index.html           # Frontend SPA com navegação e abas
├── static/
│   ├── css/
│   │   └── style.css        # Estilos profissionais Myvivio
│   └── js/
│       └── app.js           # Lógica JavaScript (tabs, navegação)
├── pyproject.toml           # Dependências Python
└── replit.md                # Esta documentação
```

## Modelos de Dados

### Modelos Principais

#### Unidade
- Academias/unidades de wellness corporativo
- Métricas de risco de desistência

#### Usuario
- Tipos: administrador, gerente, instrutor, membro
- Rastreamento de atividade e engajamento

#### Visitante
- Leads/prospects
- Controle de conversão

#### Programa
- Status: expirado, não atribuído, atribuído

### Novos Modelos - Sistema de Calendário e Aulas

#### Sala
- Nome e capacidade
- Vinculada a unidade
- Status ativo/inativo

#### Instrutor
- Nome, email, especialidades
- Foto (URL)
- Vinculado a unidade

#### EventoCalendario
- Eventos pessoais do usuário
- Título, descrição, datas
- Tipo de evento, status (pendente/cumprida)
- Lembretes e tarefas vinculadas
- Cor personalizável

#### EventoAula
- Aulas agendadas
- Instrutor e sala
- Data/hora, duração
- Limite de inscrições
- Grupos permitidos
- Suporte a recorrência
- Configurações de reserva

#### ReservaAula
- Sistema de reservas de aulas
- Controle de reserva e cancelamento
- Status de presença básico
- Datas de reserva e cancelamento
- Vinculada a usuário e aula

#### Attendance (ÚNICA FONTE DE VERDADE)
- **Registro Autoritativo de Presença**: Única fonte para todas estatísticas
- **Status Validados**: presente, falta, justificada (3 opções)
- **Metadados Completos**: observações, quem marcou, quando marcou
- **Constraint Único**: `idx_unique_attendance_reserva` no banco (1 registro/reserva)
- **Limpeza Automática**: Remove duplicatas na inicialização
- **DELETE+INSERT**: Padrão que garante unicidade em runtime
- **Histórico Completo**: Por usuário, por aula, com filtros de data
- **Vinculado**: reserva_aula_id (FK), evento_aula_id (FK), usuario_id (FK)

### Agenda
- Atividades diárias dos usuários
- Histórico de execução
- Tipos: treino, aula, avaliação, consultoria, reunião

### MetricaEngajamento
- Taxa de engajamento
- ROI (Retorno sobre Investimento)
- Produtividade
- Usuários ativos

## API Endpoints

### Autenticação
- `POST /registrar` - Criar novo usuário
- `POST /login` - Login e geração de token JWT

### Estatísticas
- `GET /stats/overview` - Visão geral de todas as métricas
- `GET /stats/unidade/{unidade_id}` - Estatísticas específicas da unidade

### Agendas
- `GET /agendas/historico` - Listar agendas do usuário (requer token)
- `POST /agendas/criar` - Criar nova atividade na agenda (requer token)
- `PUT /agendas/{agenda_id}/concluir` - Marcar agenda como concluída (requer token)

### Programas
- `GET /programas` - Listar todos os programas
- `POST /programas/criar` - Criar novo programa

### Visitantes
- `POST /visitantes/registrar` - Registrar novo visitante/lead

### Unidades
- `GET /unidades` - Listar todas as unidades
- `POST /unidades/criar` - Criar nova unidade

### Métricas IA
- `GET /metricas/ia?unidade_id=X` - Obter métricas para otimização por IA

### Calendário (NOVO)
- `POST /calendario/eventos/criar` - Criar evento no calendário
- `GET /calendario/eventos` - Listar eventos (filtros: data_inicio, data_fim, tipo_evento)
- `PUT /calendario/eventos/{evento_id}/marcar-cumprida` - Marcar evento como cumprido
- `DELETE /calendario/eventos/{evento_id}` - Deletar evento
- `GET /calendario/exportar-csv` - Exportar eventos em CSV (filtros: data_inicio, data_fim)

### Salas e Instrutores (NOVO)
- `GET /salas` - Listar todas as salas
- `POST /salas/criar` - Criar nova sala
- `GET /instrutores` - Listar todos os instrutores
- `POST /instrutores/criar` - Criar novo instrutor

### Aulas (NOVO)
- `POST /aulas/criar` - Criar aula agendada
- `GET /aulas` - Listar aulas (filtros: sala_id, instrutor_id, data_inicio, data_fim)
- `GET /aulas/{aula_id}/estatisticas` - Estatísticas da aula (ocupação, presença, faltas)
- `GET /aulas/{aula_id}/grafico` - Gráfico circular da aula (base64)
- `GET /aulas/exportar-csv` - Exportar aulas em CSV (filtros: data_inicio, data_fim)
- `POST /aulas/{aula_id}/enviar-email-inscritos` - Enviar e-mail para todos inscritos

### Reservas (NOVO)
- `POST /aulas/{aula_id}/reservar` - Reservar vaga em aula
- `GET /aulas/{aula_id}/reservas` - Listar reservas da aula
- `PUT /aulas/reservas/{reserva_id}/marcar-presenca` - Marcar presença (presente: true/false, observacoes)
- `DELETE /aulas/reservas/{reserva_id}/cancelar` - Cancelar reserva

### Attendance (NOVO)
- `GET /aulas/{aula_id}/attendance` - Listar registros de presença da aula
- `GET /usuarios/{usuario_id}/attendance` - Histórico de presença do usuário (filtros: data_inicio, data_fim)

### Frontend
- `GET /` - Interface Web completa (SPA)
- `GET /docs` - Documentação Swagger UI
- `GET /redoc` - Documentação ReDoc

## Recursos Principais

### Navegação (Sidebar Esquerda)
- **Logo**: Espaço para logo Myvivio no topo
- **Busca**: Campo de busca "Buscar no Myvivio CRM"
- **Menu Principal** (com ícones Font Awesome):
  - <i class="fa-solid fa-rocket"></i> Iniciar - Ações rápidas e bem-vindo
  - <i class="fa-solid fa-house"></i> Home - Dashboard com métricas e estatísticas
  - <i class="fa-solid fa-calendar-days"></i> Planejador - Agendas e atividades
  - <i class="fa-solid fa-users"></i> Pessoas - Lista de usuários e visitantes
  - <i class="fa-solid fa-dumbbell"></i> Treinamento - Programas e treinos
  - <i class="fa-solid fa-gear"></i> Configuração - Configurações do sistema

### Página Home (Dashboard com Abas)

#### Aba "Dia após dia" (Layout 2 colunas)
**Coluna Esquerda:**
- **Atividades**: Timeline com tarefas "Para fazer" e "Feito"
  - Cards de atividades com status visual
  - Marcação de conclusão

**Coluna Direita:**
- **Contatos**: Widgets com estatísticas de contatos (verde/amarelo/vermelho)
- **Leads**: Estatísticas de leads e conversões
- **Programas**: Visão geral rápida dos programas

#### Aba "Desempenho"
- **Seção Retenção**:
  - Card destacado com risco de desistência
  - Indicador de tendência
  - Botão "VER MAIS"

- **Seção Usuários e Visitantes**:
  - Total de usuários
  - Usuários ativos
  - Visitantes

- **Cards de Métricas de Performance**:
  - Engajamento
  - ROI
  - Produtividade
  - Membros ativos

### Página Planejador
- Lista de agendas diárias
- Botão para adicionar novas atividades
- Marcação de conclusão de atividades

### Página Treinamento
- Estatísticas de programas (expirados, não atribuídos, atribuídos)
- Grid de programas disponíveis

### Sistema de Agendas
- Criação de atividades diárias
- Tipos de atividade personalizáveis
- Controle de duração
- Marcação de conclusão
- Histórico completo

### Gestão de Programas
- Controle de status
- Usuários matriculados
- Datas de início/fim

## Preparação para IA

O sistema está estruturado para otimização por IA com:
- **Métricas de Engajamento**: Taxa de participação dos usuários
- **ROI**: Retorno sobre investimento calculado
- **Produtividade**: Índices de eficiência
- **Risco de Desistência**: Predição de churn
- **Histórico de Atividades**: Dados para análise comportamental

## Como Executar

```bash
# Instalar dependências (automático no Replit)
# O servidor inicia automaticamente

# Ou manualmente:
uvicorn metavida_app:app --host 0.0.0.0 --port 5000
```

## Próximos Passos

1. Integração com algoritmos de ML para predição de churn
2. Sistema de recomendação personalizado por IA
3. Análise preditiva de ROI
4. Dashboard de relatórios avançados
5. API para integração com wearables e dispositivos fitness
6. Implementação de gráficos e visualizações avançadas
7. Sistema de notificações em tempo real

## Notas de Desenvolvimento

- Token JWT expira em 8 horas
- Banco de dados SQLite para desenvolvimento (migrar para PostgreSQL em produção)
- CORS habilitado para desenvolvimento (restringir em produção)
- Senhas criptografadas com Argon2
- Paleta de cores mantida consistente em toda a aplicação
- Uso exclusivo de ícones Font Awesome para interface profissional

## Design System

### Cores
- **Primária (Accent Blue)**: #62b1ca - Botões principais, links, destaques
- **Secundária (Dark Blue)**: #1f2746 - Sidebar, headers, fundos escuros
- **Terciária (Medium Blue)**: #333f6e - Fundos secundários, cards
- **Neutras**: #ffffff (backgrounds), #000000 (textos)
- **Feedback**: Success (#27ae60), Warning (#f39c12), Danger (#e74c3c - apenas erros)

### Tipografia
- Família: System fonts (sans-serif)
- Tamanhos: 0.85rem a 2.5rem
- Pesos: 400 (normal), 600 (semibold), 700 (bold)

### Componentes
- Cards com sombra suave (0 2px 8px rgba(0,0,0,0.1))
- Bordas arredondadas (8px a 12px)
- Transições suaves (0.3s)
- Hover states com elevação

## Segurança

### Endpoints Protegidos (requerem autenticação JWT)
- Todas as estatísticas (`/stats/*`)
- Todas as métricas IA (`/metricas/*`)
- Todas as agendas (`/agendas/*`)
- Gestão de programas (`/programas/*`)
- Gestão de unidades (`/unidades/*`)

### Endpoints Públicos (sem autenticação)
- `/registrar` - Registro de novos usuários
- `/login` - Autenticação
- `/visitantes/registrar` - Captura de leads (por design)
- `/` - Interface web
- `/docs`, `/redoc` - Documentação API

### Produção
⚠️ **IMPORTANTE**: Configurar variável de ambiente `SESSION_SECRET` com valor seguro em produção

## Branding - Myvivio CRM

- **Nome**: Myvivio CRM
- **Slogan**: Sistema de Gestão Inteligente
- **Identidade Visual**: Design profissional inspirado em Technogym
- **Público-alvo**: Academias e programas de wellness corporativo
- **Diferencial**: Otimização por IA para engajamento e ROI
