# Gym & Corporate Wellness CRM

## Visão Geral
Sistema de gestão inteligente para academias e wellness corporativo, com foco em otimização por IA de engajamento, ROI e produtividade.

## Mudanças Recentes (09/10/2025)
- **Transformação completa**: Migração de app de saúde integral (Metavida) para CRM de gestão de academias
- Removida toda linguagem de "mente/corpo/energia"
- **Novo layout Technogym**: Sidebar de navegação esquerda fixa com 6 páginas (Iniciar, Home, Planejador, Pessoas, Treinamento, Configuração)
- **Espaço para logo**: Logo placeholder no topo da sidebar
- **Design profissional**: Interface moderna inspirada no CRM Technogym
- Implementação de sistema de agendas e métricas para IA
- **Segurança reforçada**: Todos os endpoints sensíveis protegidos com autenticação JWT
- **Autenticação moderna**: Login/registro com JSON body (não query params) e Argon2 hash

## Tecnologias

### Backend
- **Framework**: FastAPI 0.118.2
- **Servidor**: Uvicorn 0.37.0
- **Banco de Dados**: SQLite + SQLAlchemy 2.0.43
- **Autenticação**: JWT (PyJWT 2.10.1) + HTTPBearer
- **Segurança**: Argon2 (argon2-cffi 25.1.0) + Passlib 1.7.4
- **Linguagem**: Python 3.11

### Frontend
- **HTML5 + CSS3 + JavaScript Vanilla**
- **Design**: Layout inspirado em CRM Technogym com sidebar de navegação
- **Cores**: Sidebar escura (#2d2d2d), Vermelho (#E74C3C) como cor primária
- **Ícones**: Font Awesome 6.4.0
- **Navegação**: 6 páginas principais (Iniciar, Home, Planejador, Pessoas, Treinamento, Configuração)

## Estrutura do Projeto

```
.
├── metavida_app.py          # Backend FastAPI
├── gym_wellness.db          # Banco SQLite (gerado automaticamente)
├── templates/
│   └── index.html           # Frontend SPA
├── static/
│   ├── css/
│   │   └── style.css        # Estilos profissionais
│   └── js/
│       └── app.js           # Lógica JavaScript
├── pyproject.toml           # Dependências Python
└── replit.md                # Esta documentação
```

## Modelos de Dados

### Unidade
- Academias/unidades de wellness corporativo
- Métricas de risco de desistência

### Usuario
- Tipos: administrador, gerente, instrutor, membro
- Rastreamento de atividade e engajamento

### Visitante
- Leads/prospects
- Controle de conversão

### Programa
- Status: expirado, não atribuído, atribuído
- Gerenciamento de programas e turmas

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

### Frontend
- `GET /` - Interface Web completa (SPA)
- `GET /docs` - Documentação Swagger UI
- `GET /redoc` - Documentação ReDoc

## Recursos Principais

### Navegação (Sidebar Esquerda)
- **Logo**: Espaço para logo da empresa no topo
- **Menu Principal**:
  - 🚀 Iniciar - Ações rápidas e bem-vindo
  - 🏠 Home - Dashboard com métricas e estatísticas
  - 📅 Planejador - Agendas e atividades
  - 👥 Pessoas - Lista de usuários e visitantes
  - 💪 Treinamento - Programas e treinos
  - ⚙️ Configuração - Configurações do sistema

### Página Home (Dashboard)
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

## Notas de Desenvolvimento

- Token JWT expira em 8 horas
- Banco de dados SQLite para desenvolvimento (migrar para PostgreSQL em produção)
- CORS habilitado para desenvolvimento (restringir em produção)
- Senhas criptografadas com Argon2

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
