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
