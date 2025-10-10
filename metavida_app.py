# ============================================================
# Gym & Corporate Wellness Management System
# Sistema de Gestão para Academias e Wellness Corporativo
# ============================================================

from fastapi import FastAPI, Depends, HTTPException, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from passlib.context import CryptContext
import os

# ============================================================
# Configurações básicas
# ============================================================

DATABASE_URL = "sqlite:///./gym_wellness.db"
SECRET_KEY = os.getenv("SESSION_SECRET", "gym_wellness_secret_key_CHANGE_IN_PRODUCTION")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security = HTTPBearer()

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================
# Modelos de Banco de Dados
# ============================================================

class Unidade(Base):
    __tablename__ = "unidades"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True)
    endereco = Column(String)
    risco_desistencia = Column(Float, default=0.0)
    usuarios = relationship("Usuario", back_populates="unidade")
    programas = relationship("Programa", back_populates="unidade")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    senha = Column(String)
    nome = Column(String)
    tipo = Column(String)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    ativo = Column(Boolean, default=True)
    data_cadastro = Column(DateTime, default=datetime.utcnow)
    ultima_atividade = Column(DateTime, default=datetime.utcnow)
    unidade = relationship("Unidade", back_populates="usuarios")
    agendas = relationship("Agenda", back_populates="usuario")

class Visitante(Base):
    __tablename__ = "visitantes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String)
    telefone = Column(String)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    data_visita = Column(DateTime, default=datetime.utcnow)
    convertido = Column(Boolean, default=False)
    unidade = relationship("Unidade")

class Programa(Base):
    __tablename__ = "programas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    descricao = Column(Text)
    status = Column(String)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    data_inicio = Column(DateTime)
    data_fim = Column(DateTime)
    usuarios_matriculados = Column(Integer, default=0)
    unidade = relationship("Unidade", back_populates="programas")

class Agenda(Base):
    __tablename__ = "agendas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    titulo = Column(String)
    descricao = Column(Text)
    data = Column(DateTime, default=datetime.utcnow)
    concluida = Column(Boolean, default=False)
    tipo_atividade = Column(String)
    duracao_minutos = Column(Integer)
    usuario = relationship("Usuario", back_populates="agendas")

class MetricaEngajamento(Base):
    __tablename__ = "metricas_engajamento"
    id = Column(Integer, primary_key=True, index=True)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    data = Column(DateTime, default=datetime.utcnow)
    taxa_engajamento = Column(Float)
    roi = Column(Float)
    produtividade = Column(Float)
    usuarios_ativos = Column(Integer)
    unidade = relationship("Unidade")

# ============================================================
# Novos Modelos - Sistema de Calendário e Aulas
# ============================================================

class Sala(Base):
    __tablename__ = "salas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    capacidade = Column(Integer)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    ativa = Column(Boolean, default=True)
    unidade = relationship("Unidade")
    eventos_aulas = relationship("EventoAula", back_populates="sala")

class Instrutor(Base):
    __tablename__ = "instrutores"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String)
    especialidades = Column(Text)  # JSON string com lista de especialidades
    foto_url = Column(String, nullable=True)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    ativo = Column(Boolean, default=True)
    unidade = relationship("Unidade")
    eventos_aulas = relationship("EventoAula", back_populates="instrutor")

class EventoCalendario(Base):
    __tablename__ = "eventos_calendario"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    titulo = Column(String)
    descricao = Column(Text)
    data_inicio = Column(DateTime)
    data_fim = Column(DateTime)
    tipo_evento = Column(String)  # treino, reuniao, avaliacao, etc
    status = Column(String, default="pendente")  # pendente, cumprida, cancelada
    lembrete = Column(Boolean, default=False)
    tarefas_vinculadas = Column(Text)  # JSON string com lista de tarefas
    cor = Column(String, default="#62b1ca")
    usuario = relationship("Usuario")

class EventoAula(Base):
    __tablename__ = "eventos_aulas"
    id = Column(Integer, primary_key=True, index=True)
    nome_aula = Column(String)
    descricao = Column(Text)
    instrutor_id = Column(Integer, ForeignKey("instrutores.id"))
    sala_id = Column(Integer, ForeignKey("salas.id"))
    data_hora = Column(DateTime)
    dia_semana = Column(String)  # segunda, terca, etc (para recorrencia)
    duracao_minutos = Column(Integer, default=60)
    limite_inscricoes = Column(Integer)
    foto_url = Column(String, nullable=True)
    grupos_permitidos = Column(Text)  # JSON string com lista de grupos
    requer_reserva = Column(Boolean, default=True)
    config_padrao_15dias = Column(Boolean, default=True)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    recorrente = Column(Boolean, default=False)
    ativa = Column(Boolean, default=True)
    instrutor = relationship("Instrutor", back_populates="eventos_aulas")
    sala = relationship("Sala", back_populates="eventos_aulas")
    unidade = relationship("Unidade")
    reservas = relationship("ReservaAula", back_populates="evento_aula")

class ReservaAula(Base):
    __tablename__ = "reservas_aulas"
    id = Column(Integer, primary_key=True, index=True)
    evento_aula_id = Column(Integer, ForeignKey("eventos_aulas.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    data_reserva = Column(DateTime, default=datetime.utcnow)
    presente = Column(Boolean, default=False)
    cancelada = Column(Boolean, default=False)
    data_cancelamento = Column(DateTime, nullable=True)
    evento_aula = relationship("EventoAula", back_populates="reservas")
    usuario = relationship("Usuario")

# ============================================================
# Inicializar Banco de Dados
# ============================================================

Base.metadata.create_all(bind=engine)

def init_sample_data():
    db = SessionLocal()
    try:
        if db.query(Unidade).count() == 0:
            unidade = Unidade(nome="Unidade Principal", endereco="Av. Principal, 123", risco_desistencia=15.5)
            db.add(unidade)
            db.commit()
        
        if db.query(MetricaEngajamento).count() == 0:
            metrica = MetricaEngajamento(
                unidade_id=1,
                taxa_engajamento=75.0,
                roi=120.0,
                produtividade=85.0,
                usuarios_ativos=42
            )
            db.add(metrica)
            db.commit()
        
        if db.query(Sala).count() == 0:
            salas = [
                Sala(nome="Sala A - Spinning", capacidade=20, unidade_id=1),
                Sala(nome="Sala B - Yoga", capacidade=15, unidade_id=1),
                Sala(nome="Sala C - Musculação", capacidade=30, unidade_id=1)
            ]
            for sala in salas:
                db.add(sala)
            db.commit()
        
        if db.query(Instrutor).count() == 0:
            instrutores = [
                Instrutor(nome="Carlos Silva", email="carlos@gym.com", especialidades="Spinning, HIIT", unidade_id=1),
                Instrutor(nome="Ana Martins", email="ana@gym.com", especialidades="Yoga, Pilates", unidade_id=1),
                Instrutor(nome="João Santos", email="joao@gym.com", especialidades="Musculação, Funcional", unidade_id=1)
            ]
            for instrutor in instrutores:
                db.add(instrutor)
            db.commit()
        
        if db.query(EventoAula).count() == 0:
            aulas = [
                EventoAula(
                    nome_aula="Spinning Matinal",
                    descricao="Aula intensa de spinning para começar o dia",
                    instrutor_id=1,
                    sala_id=1,
                    data_hora=datetime.utcnow() + timedelta(days=1, hours=6),
                    duracao_minutos=45,
                    limite_inscricoes=20,
                    unidade_id=1
                ),
                EventoAula(
                    nome_aula="Yoga Relaxante",
                    descricao="Sessão de yoga para relaxamento",
                    instrutor_id=2,
                    sala_id=2,
                    data_hora=datetime.utcnow() + timedelta(days=1, hours=18),
                    duracao_minutos=60,
                    limite_inscricoes=15,
                    unidade_id=1
                ),
                EventoAula(
                    nome_aula="Treino Funcional",
                    descricao="Treino funcional de alta intensidade",
                    instrutor_id=3,
                    sala_id=3,
                    data_hora=datetime.utcnow() + timedelta(days=2, hours=7),
                    duracao_minutos=50,
                    limite_inscricoes=25,
                    unidade_id=1
                )
            ]
            for aula in aulas:
                db.add(aula)
            db.commit()
    finally:
        db.close()

init_sample_data()

# ============================================================
# Utilitários
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_plana, senha_hash)

def criar_token_acesso(data: dict, expira_em: timedelta = timedelta(hours=8)):
    to_encode = data.copy()
    expira = datetime.utcnow() + expira_em
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> Usuario:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        if usuario is None:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        return usuario
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

# ============================================================
# Inicializar app FastAPI
# ============================================================

app = FastAPI(
    title="Gym & Corporate Wellness CRM",
    description="Sistema de gestão para academias e wellness corporativo",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para desabilitar cache
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static") or request.url.path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    response = FileResponse("templates/index.html")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# ============================================================
# Endpoints de Autenticação
# ============================================================

from pydantic import BaseModel

class RegistroRequest(BaseModel):
    email: str
    senha: str
    nome: str
    tipo: str
    unidade_id: int

class LoginRequest(BaseModel):
    email: str
    senha: str

@app.post("/registrar")
def registrar(dados: RegistroRequest, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == dados.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    usuario = Usuario(
        email=dados.email, 
        senha=hash_senha(dados.senha), 
        nome=dados.nome, 
        tipo=dados.tipo, 
        unidade_id=dados.unidade_id
    )
    db.add(usuario)
    db.commit()
    return {"mensagem": "Usuário registrado com sucesso!"}

@app.post("/login")
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or not verificar_senha(dados.senha, usuario.senha):
        raise HTTPException(status_code=400, detail="Credenciais inválidas")
    
    usuario.ultima_atividade = datetime.utcnow()
    db.commit()
    
    token = criar_token_acesso({"sub": usuario.email})
    return {"access_token": token, "tipo": "bearer"}

# ============================================================
# Endpoints de Estatísticas
# ============================================================

@app.get("/stats/overview")
def stats_overview(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    total_usuarios = db.query(Usuario).count()
    usuarios_ativos = db.query(Usuario).filter(Usuario.ativo == True).count()
    total_visitantes = db.query(Visitante).count()
    
    unidades = db.query(Unidade).all()
    risco_medio = sum([u.risco_desistencia for u in unidades]) / len(unidades) if unidades else 0
    
    programas_expirados = db.query(Programa).filter(Programa.status == "expirado").count()
    programas_nao_atribuidos = db.query(Programa).filter(Programa.status == "não atribuído").count()
    programas_atribuidos = db.query(Programa).filter(Programa.status == "atribuído").count()
    
    return {
        "risco_desistencia": round(risco_medio, 2),
        "usuarios_totais": total_usuarios,
        "visitantes": total_visitantes,
        "usuarios_ativos": usuarios_ativos,
        "programas": {
            "expirados": programas_expirados,
            "nao_atribuidos": programas_nao_atribuidos,
            "atribuidos": programas_atribuidos,
            "total": programas_expirados + programas_nao_atribuidos + programas_atribuidos
        }
    }

@app.get("/stats/unidade/{unidade_id}")
def stats_unidade(unidade_id: int, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    unidade = db.query(Unidade).filter(Unidade.id == unidade_id).first()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    usuarios = db.query(Usuario).filter(Usuario.unidade_id == unidade_id).count()
    usuarios_ativos = db.query(Usuario).filter(
        Usuario.unidade_id == unidade_id, 
        Usuario.ativo == True
    ).count()
    
    return {
        "unidade": unidade.nome,
        "risco_desistencia": unidade.risco_desistencia,
        "usuarios": usuarios,
        "usuarios_ativos": usuarios_ativos
    }

# ============================================================
# Endpoints de Agendas
# ============================================================

@app.get("/agendas/historico")
def listar_agendas(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    agendas = db.query(Agenda).filter(Agenda.usuario_id == usuario.id).order_by(Agenda.data.desc()).limit(30).all()
    
    return [{
        "id": a.id,
        "titulo": a.titulo,
        "descricao": a.descricao,
        "data": a.data.isoformat(),
        "concluida": a.concluida,
        "tipo_atividade": a.tipo_atividade,
        "duracao_minutos": a.duracao_minutos
    } for a in agendas]

@app.post("/agendas/criar")
def criar_agenda(
    titulo: str, 
    descricao: str, 
    tipo_atividade: str, 
    duracao_minutos: int,
    usuario: Usuario = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    agenda = Agenda(
        usuario_id=usuario.id,
        titulo=titulo,
        descricao=descricao,
        tipo_atividade=tipo_atividade,
        duracao_minutos=duracao_minutos
    )
    db.add(agenda)
    db.commit()
    db.refresh(agenda)
    
    return {"mensagem": "Agenda criada com sucesso!", "id": agenda.id}

@app.put("/agendas/{agenda_id}/concluir")
def concluir_agenda(agenda_id: int, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    agenda = db.query(Agenda).filter(Agenda.id == agenda_id, Agenda.usuario_id == usuario.id).first()
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda não encontrada")
    
    agenda.concluida = True
    db.commit()
    
    return {"mensagem": "Agenda concluída!"}

# ============================================================
# Endpoints de Programas
# ============================================================

@app.get("/programas")
def listar_programas(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    programas = db.query(Programa).all()
    return [{
        "id": p.id,
        "nome": p.nome,
        "status": p.status,
        "usuarios_matriculados": p.usuarios_matriculados
    } for p in programas]

@app.post("/programas/criar")
def criar_programa(
    nome: str, 
    descricao: str, 
    status: str, 
    unidade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    programa = Programa(
        nome=nome,
        descricao=descricao,
        status=status,
        unidade_id=unidade_id,
        data_inicio=datetime.utcnow()
    )
    db.add(programa)
    db.commit()
    
    return {"mensagem": "Programa criado com sucesso!", "id": programa.id}

# ============================================================
# Endpoints de Visitantes
# ============================================================

@app.post("/visitantes/registrar")
def registrar_visitante(
    nome: str, 
    email: str, 
    telefone: str, 
    unidade_id: int,
    db: Session = Depends(get_db)
):
    visitante = Visitante(
        nome=nome,
        email=email,
        telefone=telefone,
        unidade_id=unidade_id
    )
    db.add(visitante)
    db.commit()
    
    return {"mensagem": "Visitante registrado com sucesso!"}

# ============================================================
# Endpoints de Unidades
# ============================================================

@app.get("/unidades")
def listar_unidades(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    unidades = db.query(Unidade).all()
    return [{
        "id": u.id,
        "nome": u.nome,
        "endereco": u.endereco,
        "risco_desistencia": u.risco_desistencia
    } for u in unidades]

@app.post("/unidades/criar")
def criar_unidade(nome: str, endereco: str, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    unidade = Unidade(nome=nome, endereco=endereco)
    db.add(unidade)
    db.commit()
    
    return {"mensagem": "Unidade criada com sucesso!", "id": unidade.id}

# ============================================================
# Endpoints de Métricas IA
# ============================================================

@app.get("/metricas/ia")
def metricas_ia(unidade_id: int, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    metrica = db.query(MetricaEngajamento).filter(
        MetricaEngajamento.unidade_id == unidade_id
    ).order_by(MetricaEngajamento.data.desc()).first()
    
    if not metrica:
        return {
            "engajamento": 0,
            "roi": 0,
            "produtividade": 0,
            "usuarios_ativos": 0
        }
    
    return {
        "engajamento": metrica.taxa_engajamento,
        "roi": metrica.roi,
        "produtividade": metrica.produtividade,
        "usuarios_ativos": metrica.usuarios_ativos
    }

# ============================================================
# Endpoints de Calendário
# ============================================================

@app.post("/calendario/eventos/criar")
def criar_evento_calendario(
    titulo: str,
    descricao: str,
    data_inicio: str,
    data_fim: str,
    tipo_evento: str,
    lembrete: bool = False,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    evento = EventoCalendario(
        usuario_id=usuario.id,
        titulo=titulo,
        descricao=descricao,
        data_inicio=datetime.fromisoformat(data_inicio),
        data_fim=datetime.fromisoformat(data_fim),
        tipo_evento=tipo_evento,
        lembrete=lembrete
    )
    db.add(evento)
    db.commit()
    return {"mensagem": "Evento criado com sucesso!", "id": evento.id}

@app.get("/calendario/eventos")
def listar_eventos_calendario(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    tipo_evento: Optional[str] = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(EventoCalendario).filter(EventoCalendario.usuario_id == usuario.id)
    
    if data_inicio:
        query = query.filter(EventoCalendario.data_inicio >= datetime.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(EventoCalendario.data_fim <= datetime.fromisoformat(data_fim))
    if tipo_evento:
        query = query.filter(EventoCalendario.tipo_evento == tipo_evento)
    
    eventos = query.order_by(EventoCalendario.data_inicio).all()
    
    return [{
        "id": e.id,
        "titulo": e.titulo,
        "descricao": e.descricao,
        "data_inicio": e.data_inicio.isoformat() if e.data_inicio else None,
        "data_fim": e.data_fim.isoformat() if e.data_fim else None,
        "tipo_evento": e.tipo_evento,
        "status": e.status,
        "lembrete": e.lembrete,
        "cor": e.cor
    } for e in eventos]

@app.put("/calendario/eventos/{evento_id}/marcar-cumprida")
def marcar_evento_cumprida(
    evento_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    evento = db.query(EventoCalendario).filter(
        EventoCalendario.id == evento_id,
        EventoCalendario.usuario_id == usuario.id
    ).first()
    
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    evento.status = "cumprida"
    db.commit()
    return {"mensagem": "Evento marcado como cumprido!"}

@app.delete("/calendario/eventos/{evento_id}")
def deletar_evento_calendario(
    evento_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    evento = db.query(EventoCalendario).filter(
        EventoCalendario.id == evento_id,
        EventoCalendario.usuario_id == usuario.id
    ).first()
    
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    db.delete(evento)
    db.commit()
    return {"mensagem": "Evento deletado com sucesso!"}

# ============================================================
# Endpoints de Salas
# ============================================================

@app.get("/salas")
def listar_salas(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    salas = db.query(Sala).filter(Sala.ativa == True).all()
    return [{
        "id": s.id,
        "nome": s.nome,
        "capacidade": s.capacidade,
        "unidade_id": s.unidade_id
    } for s in salas]

@app.post("/salas/criar")
def criar_sala(
    nome: str,
    capacidade: int,
    unidade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sala = Sala(nome=nome, capacidade=capacidade, unidade_id=unidade_id)
    db.add(sala)
    db.commit()
    return {"mensagem": "Sala criada com sucesso!", "id": sala.id}

# ============================================================
# Endpoints de Instrutores
# ============================================================

@app.get("/instrutores")
def listar_instrutores(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    instrutores = db.query(Instrutor).filter(Instrutor.ativo == True).all()
    return [{
        "id": i.id,
        "nome": i.nome,
        "email": i.email,
        "especialidades": i.especialidades,
        "foto_url": i.foto_url
    } for i in instrutores]

@app.post("/instrutores/criar")
def criar_instrutor(
    nome: str,
    email: str,
    especialidades: str,
    unidade_id: int,
    foto_url: str = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    instrutor = Instrutor(
        nome=nome,
        email=email,
        especialidades=especialidades,
        unidade_id=unidade_id,
        foto_url=foto_url
    )
    db.add(instrutor)
    db.commit()
    return {"mensagem": "Instrutor criado com sucesso!", "id": instrutor.id}

# ============================================================
# Endpoints de Agendamento de Aulas
# ============================================================

@app.post("/aulas/criar")
def criar_evento_aula(
    nome_aula: str,
    descricao: str,
    instrutor_id: int,
    sala_id: int,
    data_hora: str,
    limite_inscricoes: int,
    duracao_minutos: int = 60,
    dia_semana: str = None,
    grupos_permitidos: str = "[]",
    requer_reserva: bool = True,
    recorrente: bool = False,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    evento = EventoAula(
        nome_aula=nome_aula,
        descricao=descricao,
        instrutor_id=instrutor_id,
        sala_id=sala_id,
        data_hora=datetime.fromisoformat(data_hora),
        duracao_minutos=duracao_minutos,
        dia_semana=dia_semana,
        limite_inscricoes=limite_inscricoes,
        grupos_permitidos=grupos_permitidos,
        requer_reserva=requer_reserva,
        recorrente=recorrente,
        unidade_id=usuario.unidade_id or 1
    )
    db.add(evento)
    db.commit()
    return {"mensagem": "Aula criada com sucesso!", "id": evento.id}

@app.get("/aulas")
def listar_aulas(
    sala_id: Optional[int] = None,
    instrutor_id: Optional[int] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(EventoAula).filter(EventoAula.ativa == True)
    
    if sala_id:
        query = query.filter(EventoAula.sala_id == sala_id)
    if instrutor_id:
        query = query.filter(EventoAula.instrutor_id == instrutor_id)
    if data_inicio:
        query = query.filter(EventoAula.data_hora >= datetime.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(EventoAula.data_hora <= datetime.fromisoformat(data_fim))
    
    aulas = query.order_by(EventoAula.data_hora).all()
    
    return [{
        "id": a.id,
        "nome_aula": a.nome_aula,
        "descricao": a.descricao,
        "instrutor": a.instrutor.nome if a.instrutor else None,
        "sala": a.sala.nome if a.sala else None,
        "data_hora": a.data_hora.isoformat() if a.data_hora else None,
        "duracao_minutos": a.duracao_minutos,
        "limite_inscricoes": a.limite_inscricoes,
        "total_reservas": len([r for r in a.reservas if not r.cancelada]),
        "foto_url": a.foto_url
    } for a in aulas]

# ============================================================
# Endpoints de Reservas de Aulas
# ============================================================

@app.post("/aulas/{aula_id}/reservar")
def reservar_aula(
    aula_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    
    reservas_ativas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id,
        ReservaAula.cancelada == False
    ).count()
    
    if reservas_ativas >= aula.limite_inscricoes:
        raise HTTPException(status_code=400, detail="Aula lotada")
    
    reserva_existente = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id,
        ReservaAula.usuario_id == usuario.id,
        ReservaAula.cancelada == False
    ).first()
    
    if reserva_existente:
        raise HTTPException(status_code=400, detail="Você já reservou esta aula")
    
    reserva = ReservaAula(evento_aula_id=aula_id, usuario_id=usuario.id)
    db.add(reserva)
    db.commit()
    
    return {"mensagem": "Reserva realizada com sucesso!", "id": reserva.id}

@app.get("/aulas/{aula_id}/reservas")
def listar_reservas_aula(
    aula_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id
    ).all()
    
    return [{
        "id": r.id,
        "usuario_nome": r.usuario.nome if r.usuario else "Desconhecido",
        "usuario_email": r.usuario.email if r.usuario else "",
        "data_reserva": r.data_reserva.isoformat() if r.data_reserva else None,
        "presente": r.presente,
        "cancelada": r.cancelada
    } for r in reservas]

@app.put("/aulas/reservas/{reserva_id}/marcar-presenca")
def marcar_presenca(
    reserva_id: int,
    presente: bool,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reserva = db.query(ReservaAula).filter(ReservaAula.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reserva.presente = presente
    db.commit()
    return {"mensagem": "Presença atualizada com sucesso!"}

@app.delete("/aulas/reservas/{reserva_id}/cancelar")
def cancelar_reserva(
    reserva_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reserva = db.query(ReservaAula).filter(
        ReservaAula.id == reserva_id,
        ReservaAula.usuario_id == usuario.id
    ).first()
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reserva.cancelada = True
    reserva.data_cancelamento = datetime.utcnow()
    db.commit()
    return {"mensagem": "Reserva cancelada com sucesso!"}

# ============================================================
# Funcionalidade de E-mail
# ============================================================

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

async def enviar_email(destinatario: str, assunto: str, corpo: str):
    """
    Função para enviar e-mail (configurar SMTP em produção)
    """
    # Configurações de exemplo - ajustar para servidor SMTP real
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "noreply@myvivio.com")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    
    message = MIMEMultipart()
    message["From"] = smtp_user
    message["To"] = destinatario
    message["Subject"] = assunto
    
    message.attach(MIMEText(corpo, "html"))
    
    try:
        if smtp_pass:  # Só tenta enviar se tiver senha configurada
            await aiosmtplib.send(
                message,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
                start_tls=True
            )
            return True
        return False
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return False

@app.post("/aulas/{aula_id}/enviar-email-inscritos")
async def enviar_email_inscritos(
    aula_id: int,
    assunto: str,
    mensagem: str,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Envia e-mail para todos os inscritos em uma aula
    """
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    
    reservas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id,
        ReservaAula.cancelada == False
    ).all()
    
    if not reservas:
        return {"mensagem": "Nenhum inscrito para enviar e-mail"}
    
    # Template de e-mail com placeholders
    corpo_email = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #62b1ca;">Myvivio CRM - {aula.nome_aula}</h2>
                <p>{mensagem}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p><strong>Detalhes da Aula:</strong></p>
                <ul>
                    <li>Aula: {aula.nome_aula}</li>
                    <li>Instrutor: {aula.instrutor.nome if aula.instrutor else 'N/A'}</li>
                    <li>Sala: {aula.sala.nome if aula.sala else 'N/A'}</li>
                    <li>Data/Hora: {aula.data_hora.strftime('%d/%m/%Y às %H:%M') if aula.data_hora else 'N/A'}</li>
                </ul>
                <p style="color: #666; font-size: 12px;">Este é um e-mail automático do Myvivio CRM</p>
            </div>
        </body>
    </html>
    """
    
    emails_enviados = 0
    for reserva in reservas:
        if reserva.usuario and reserva.usuario.email:
            sucesso = await enviar_email(
                reserva.usuario.email,
                assunto,
                corpo_email
            )
            if sucesso:
                emails_enviados += 1
    
    return {
        "mensagem": f"E-mails enviados com sucesso!",
        "total_inscritos": len(reservas),
        "emails_enviados": emails_enviados
    }

# ============================================================
# Geração de Gráficos e Relatórios
# ============================================================

import matplotlib
matplotlib.use('Agg')  # Backend não-interativo
import matplotlib.pyplot as plt
import io
import base64
from fastapi.responses import StreamingResponse
import csv

def gerar_grafico_circular(dados: dict) -> str:
    """
    Gera gráfico circular e retorna em base64
    """
    labels = list(dados.keys())
    sizes = list(dados.values())
    colors = ['#62b1ca', '#27ae60', '#f39c12', '#e74c3c']
    
    plt.figure(figsize=(8, 6))
    plt.pie(sizes, labels=labels, colors=colors[:len(labels)], autopct='%1.1f%%', startangle=90)
    plt.axis('equal')
    
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"

@app.get("/aulas/{aula_id}/grafico")
def grafico_aula(
    aula_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Gera gráfico circular com estatísticas da aula
    """
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    
    reservas = db.query(ReservaAula).filter(ReservaAula.evento_aula_id == aula_id).all()
    
    total_inscricoes = len([r for r in reservas if not r.cancelada])
    total_presentes = len([r for r in reservas if r.presente and not r.cancelada])
    total_faltas = len([r for r in reservas if not r.presente and not r.cancelada and aula.data_hora < datetime.utcnow()])
    vagas_disponiveis = aula.limite_inscricoes - total_inscricoes
    
    dados_grafico = {
        "Presentes": total_presentes,
        "Faltas": total_faltas,
        "Vagas Disponíveis": vagas_disponiveis
    }
    
    # Remover zeros
    dados_grafico = {k: v for k, v in dados_grafico.items() if v > 0}
    
    if not dados_grafico:
        return {"erro": "Sem dados para gráfico"}
    
    grafico_base64 = gerar_grafico_circular(dados_grafico)
    
    return {
        "aula": aula.nome_aula,
        "grafico": grafico_base64,
        "dados": dados_grafico
    }

@app.get("/calendario/exportar-csv")
def exportar_calendario_csv(
    data_inicio: str,
    data_fim: str,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exporta eventos do calendário em CSV
    """
    eventos = db.query(EventoCalendario).filter(
        EventoCalendario.usuario_id == usuario.id,
        EventoCalendario.data_inicio >= datetime.fromisoformat(data_inicio),
        EventoCalendario.data_fim <= datetime.fromisoformat(data_fim)
    ).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Cabeçalho
    writer.writerow(['ID', 'Título', 'Descrição', 'Data Início', 'Data Fim', 'Tipo', 'Status'])
    
    # Dados
    for e in eventos:
        writer.writerow([
            e.id,
            e.titulo,
            e.descricao,
            e.data_inicio.isoformat() if e.data_inicio else '',
            e.data_fim.isoformat() if e.data_fim else '',
            e.tipo_evento,
            e.status
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=calendario_{data_inicio}_{data_fim}.csv"}
    )

@app.get("/aulas/exportar-csv")
def exportar_aulas_csv(
    data_inicio: str,
    data_fim: str,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exporta aulas em CSV
    """
    aulas = db.query(EventoAula).filter(
        EventoAula.ativa == True,
        EventoAula.data_hora >= datetime.fromisoformat(data_inicio),
        EventoAula.data_hora <= datetime.fromisoformat(data_fim)
    ).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Cabeçalho
    writer.writerow(['ID', 'Aula', 'Instrutor', 'Sala', 'Data/Hora', 'Duração', 'Limite', 'Inscritos'])
    
    # Dados
    for a in aulas:
        writer.writerow([
            a.id,
            a.nome_aula,
            a.instrutor.nome if a.instrutor else '',
            a.sala.nome if a.sala else '',
            a.data_hora.isoformat() if a.data_hora else '',
            a.duracao_minutos,
            a.limite_inscricoes,
            len([r for r in a.reservas if not r.cancelada])
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aulas_{data_inicio}_{data_fim}.csv"}
    )

# ============================================================
# Endpoints de Estatísticas e Relatórios
# ============================================================

@app.get("/aulas/{aula_id}/estatisticas")
def estatisticas_aula(
    aula_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    
    reservas = db.query(ReservaAula).filter(ReservaAula.evento_aula_id == aula_id).all()
    
    total_inscricoes = len([r for r in reservas if not r.cancelada])
    total_presentes = len([r for r in reservas if r.presente and not r.cancelada])
    total_faltas = len([r for r in reservas if not r.presente and not r.cancelada and aula.data_hora < datetime.utcnow()])
    total_canceladas = len([r for r in reservas if r.cancelada])
    
    ocupacao_percentual = (total_inscricoes / aula.limite_inscricoes * 100) if aula.limite_inscricoes > 0 else 0
    
    return {
        "aula_id": aula_id,
        "nome_aula": aula.nome_aula,
        "limite_inscricoes": aula.limite_inscricoes,
        "total_inscricoes": total_inscricoes,
        "total_presentes": total_presentes,
        "total_faltas": total_faltas,
        "total_canceladas": total_canceladas,
        "ocupacao_percentual": round(ocupacao_percentual, 2),
        "vagas_disponiveis": aula.limite_inscricoes - total_inscricoes
    }
