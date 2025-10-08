# Metavida App - Backend de Saúde Integral

## Visão Geral
Backend completo em FastAPI para o aplicativo Metavida, focado em saúde integral através do equilíbrio entre corpo, mente e energia. Sistema com gamificação, comunidades e recompensas.

## Status Atual
- ✅ Backend FastAPI totalmente funcional
- ✅ Banco de dados SQLite configurado
- ✅ Sistema de autenticação JWT com segurança aprimorada
- ✅ Hash de senhas com Argon2 (salt único por usuário)
- ✅ SECRET_KEY via variável de ambiente SESSION_SECRET
- ✅ Autenticação via header Authorization Bearer
- ✅ Gamificação com tokens e vouchers
- ✅ API REST completa
- ✅ Documentação Swagger disponível

## Arquitetura do Projeto

### Tecnologias
- **Framework**: FastAPI 0.118.2
- **Servidor**: Uvicorn 0.37.0
- **Banco de Dados**: SQLite + SQLAlchemy 2.0.43
- **Autenticação**: JWT (PyJWT 2.10.1) + HTTPBearer
- **Segurança**: Argon2 (argon2-cffi 25.1.0) + Passlib 1.7.4
- **Linguagem**: Python 3.11

### Estrutura de Arquivos
```
.
├── metavida_app.py          # Aplicação principal FastAPI
├── metavida_app.db          # Banco de dados SQLite (gerado automaticamente)
├── pyproject.toml           # Configuração uv/Python
├── .gitignore               # Arquivos ignorados pelo git
└── replit.md                # Esta documentação
```

### Modelos de Dados
1. **Comunidade**: Agrupa usuários por localização/interesse
2. **Usuario**: Perfil do usuário com tokens e objetivo
3. **Pratica**: Registro de atividades (mente, corpo, energia)
4. **Voucher**: Recompensas resgatáveis

## API Endpoints

### Autenticação
- `POST /registrar` - Criar novo usuário
- `POST /login` - Login e geração de token JWT

### Práticas
- `POST /praticas` - Registrar prática (requer token)
- `GET /praticas/plano?objetivo=X` - Gerar plano personalizado

### Gamificação
- `GET /ranking` - Top 10 usuários por tokens
- `POST /recompensas/voucher` - Gerar voucher (20 tokens)

### Relatórios
- `GET /relatorios/engajamento` - Estatísticas da comunidade

### Documentação
- `GET /` - Mensagem de boas-vindas
- `GET /docs` - Documentação Swagger UI
- `GET /redoc` - Documentação ReDoc

## Como Usar

### Iniciar o Servidor
O aplicativo está configurado para iniciar automaticamente via workflow:
```bash
uvicorn metavida_app:app --host 0.0.0.0 --port 5000 --reload
```

### Acessar a API
- **URL Base**: `https://<seu-repl>.repl.co`
- **Documentação**: `https://<seu-repl>.repl.co/docs`

### Exemplo de Uso

#### 1. Registrar Usuário
```bash
POST /registrar?email=usuario@exemplo.com&senha=minhasenha&nome=Nome&idade=30&objetivo=reduzir%20estresse&comunidade_nome=Minha%20Comunidade
```

#### 2. Fazer Login
```bash
POST /login?email=usuario@exemplo.com&senha=minhasenha
# Retorna: {"access_token": "eyJ...", "tipo": "bearer"}
```

#### 3. Registrar Prática (Autenticado)
```bash
POST /praticas?dimensao=mente&atividade=Meditacao&duracao=30
Header: Authorization: Bearer eyJ...
```

#### 4. Ver Ranking (Público)
```bash
GET /ranking
```

#### 5. Resgatar Voucher (Autenticado)
```bash
POST /recompensas/voucher
Header: Authorization: Bearer eyJ...
```

**IMPORTANTE**: Configure a variável de ambiente `SESSION_SECRET` antes de usar em produção!

## Dimensões de Bem-Estar

### Mente
- Foco: clareza mental e concentração
- Exemplos: meditação, leitura, afirmações

### Corpo
- Foco: vitalidade e força física
- Exemplos: yoga, caminhada, treino funcional

### Energia
- Foco: equilíbrio e serenidade interior
- Exemplos: respiração consciente, exposição solar

## Sistema de Tokens
- Ganho: 0.2 tokens por minuto de prática
- Resgate: 20 tokens = 1 voucher de R$10

## Últimas Alterações
**08 de Outubro de 2025**
- ✅ Projeto criado com estrutura completa
- ✅ Instalado Python 3.11 e dependências
- ✅ Configurado workflow do Uvicorn
- ✅ Implementadas melhorias críticas de segurança:
  - Hash de senhas com Argon2 e salt único
  - SECRET_KEY via variável de ambiente SESSION_SECRET
  - Autenticação via Authorization Bearer header
  - Validação de usuário existente em cada request autenticado
- ✅ API testada e funcionando perfeitamente
- ✅ Documentação Swagger ativa
- ✅ Aprovado pelo arquiteto - pronto para uso

## Próximos Passos Sugeridos
- [ ] Migrar para PostgreSQL (produção)
- [ ] Implementar sistema de notificações
- [ ] Criar frontend web/mobile
- [ ] Adicionar integração com wearables
- [ ] Sistema de desafios entre comunidades
- [ ] Dashboard administrativo
