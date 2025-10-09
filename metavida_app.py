# ============================================================
# metavida_app.py
# Backend MVP completo - Aplicativo de Saúde Integral (Método Metavida)
# ============================================================

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime, timedelta
from typing import Optional, List
import random
import hashlib
import jwt
from passlib.context import CryptContext
import os

# ============================================================
# Configurações básicas
# ============================================================

DATABASE_URL = "sqlite:///./metavida_app.db"
SECRET_KEY = os.getenv("SESSION_SECRET", "metavida_secret_key_CHANGE_THIS_IN_PRODUCTION")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security = HTTPBearer()

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================
# Modelos de Banco de Dados
# ============================================================

class Comunidade(Base):
    __tablename__ = "comunidades"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True)
    pais = Column(String)
    usuarios = relationship("Usuario", back_populates="comunidade")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    senha = Column(String)
    nome = Column(String)
    idade = Column(Integer)
    objetivo = Column(String)
    comunidade_id = Column(Integer, ForeignKey("comunidades.id"))
    tokens = Column(Float, default=0)
    comunidade = relationship("Comunidade", back_populates="usuarios")
    praticas = relationship("Pratica", back_populates="usuario")

class Pratica(Base):
    __tablename__ = "praticas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    dimensao = Column(String)  # mente, corpo ou energia
    atividade = Column(String)
    duracao = Column(Integer)
    beneficio = Column(String)
    data = Column(DateTime, default=datetime.utcnow)
    usuario = relationship("Usuario", back_populates="praticas")

class Voucher(Base):
    __tablename__ = "vouchers"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True)
    valor = Column(Float)
    resgatado = Column(Boolean, default=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    usuario = relationship("Usuario")

# ============================================================
# Inicializar Banco de Dados
# ============================================================

Base.metadata.create_all(bind=engine)

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

def criar_token_acesso(data: dict, expira_em: timedelta = timedelta(hours=3)):
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
    title="Metavida App - Saúde Integral",
    description="Backend do aplicativo Metavida: corpo, mente e energia em equilíbrio.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("templates/index.html")

# ============================================================
# Endpoints de Autenticação e Usuários
# ============================================================

@app.post("/registrar")
def registrar(email: str, senha: str, nome: str, idade: int, objetivo: str, comunidade_nome: str, db: Session = Depends(get_db)):
    comunidade = db.query(Comunidade).filter(Comunidade.nome == comunidade_nome).first()
    if not comunidade:
        comunidade = Comunidade(nome=comunidade_nome, pais="Desconhecido")
        db.add(comunidade)
        db.commit()
        db.refresh(comunidade)

    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    usuario = Usuario(email=email, senha=hash_senha(senha), nome=nome, idade=idade, objetivo=objetivo, comunidade_id=comunidade.id)
    db.add(usuario)
    db.commit()
    return {"mensagem": "Usuário Metavida registrado com sucesso!"}

@app.post("/login")
def login(email: str, senha: str, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not verificar_senha(senha, usuario.senha):
        raise HTTPException(status_code=400, detail="Credenciais inválidas")
    token = criar_token_acesso({"sub": usuario.email})
    return {"access_token": token, "tipo": "bearer"}

# ============================================================
# Endpoints das Práticas (mente, corpo, energia)
# ============================================================

@app.post("/praticas")
def registrar_pratica(dimensao: str, atividade: str, duracao: int, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    beneficios = {
        "mente": "clareza mental e foco",
        "corpo": "vitalidade e força física",
        "energia": "equilíbrio e serenidade interior"
    }
    beneficio = beneficios.get(dimensao.lower(), "bem-estar geral")

    pratica = Pratica(usuario_id=usuario.id, dimensao=dimensao, atividade=atividade, duracao=duracao, beneficio=beneficio)
    usuario.tokens += duracao * 0.2
    db.add(pratica)
    db.commit()

    return {"mensagem": f"Prática de {dimensao} registada com sucesso!", "tokens": usuario.tokens}

@app.get("/praticas/plano")
def gerar_plano(objetivo: str):
    """IA simbólica: sugere práticas integradas com base no objetivo."""
    if objetivo.lower() == "reduzir estresse":
        plano = {"mente": "Meditação guiada", "corpo": "Yoga suave", "energia": "Respiração consciente"}
    elif objetivo.lower() == "ganhar energia":
        plano = {"mente": "Afirmações positivas", "corpo": "Treino funcional leve", "energia": "Exposição solar matinal"}
    else:
        plano = {"mente": "Leitura reflexiva", "corpo": "Caminhada", "energia": "Relaxamento energético"}
    return {"objetivo": objetivo, "plano_sugerido": plano}

# ============================================================
# Gamificação e Recompensas Metavida
# ============================================================

@app.get("/ranking")
def ranking(db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).order_by(Usuario.tokens.desc()).limit(10).all()
    return [{"nome": u.nome, "tokens": u.tokens} for u in usuarios]

@app.post("/recompensas/voucher")
def gerar_voucher(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if usuario.tokens < 20:
        raise HTTPException(status_code=400, detail="Tokens insuficientes para resgate")
    codigo = hashlib.md5(f"{usuario.email}{datetime.utcnow()}".encode()).hexdigest()[:10]
    voucher = Voucher(codigo=codigo, valor=10.0, usuario_id=usuario.id)
    usuario.tokens -= 20
    db.add(voucher)
    db.commit()
    return {"codigo_voucher": codigo, "valor": "R$10,00", "mensagem": "Parabéns! Continue evoluindo com o Metavida."}

# ============================================================
# Relatórios de Engajamento e Equilíbrio
# ============================================================

@app.get("/relatorios/engajamento")
def relatorio_engajamento(db: Session = Depends(get_db)):
    total_usuarios = db.query(Usuario).count()
    ativos = db.query(Pratica.usuario_id).distinct().count()
    engajamento = round((ativos / total_usuarios * 100), 2) if total_usuarios > 0 else 0
    nivel = "baixo" if engajamento < 40 else "alto" if engajamento > 70 else "moderado"
    return {
        "usuarios_totais": total_usuarios,
        "usuarios_ativos": ativos,
        "engajamento_%": engajamento,
        "nivel": nivel,
        "mensagem": f"O equilíbrio geral das comunidades Metavida está em nível {nivel}."
    }

