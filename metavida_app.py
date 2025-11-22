# ============================================================
# Gym & Corporate Wellness Management System
# Sistema de Gestão para Academias e Wellness Corporativo
# ============================================================

from fastapi import FastAPI, Depends, HTTPException, Header, Request, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Index
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
SECRET_KEY = os.getenv("SESSION_SECRET",
                       "gym_wellness_secret_key_CHANGE_IN_PRODUCTION")
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
    status = Column(String,
                    default="pendente")  # pendente, cumprida, cancelada
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
    attendance_records = relationship("Attendance", back_populates="reserva")


class Attendance(Base):
    __tablename__ = "attendance"
    # Constraint único será adicionado APÓS limpeza de duplicatas na inicialização
    id = Column(Integer, primary_key=True, index=True)
    reserva_aula_id = Column(Integer,
                             ForeignKey("reservas_aulas.id"),
                             index=True)
    evento_aula_id = Column(Integer, ForeignKey("eventos_aulas.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    status = Column(String)  # presente, falta, justificada
    data_marcacao = Column(DateTime, default=datetime.utcnow)
    observacoes = Column(Text, nullable=True)
    marcado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    reserva = relationship("ReservaAula", back_populates="attendance_records")
    evento_aula = relationship("EventoAula")
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    marcador = relationship("Usuario", foreign_keys=[marcado_por])


class Exercicio(Base):
    __tablename__ = "exercicios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=True)  # Peso do corpo, Funcional, etc
    quem_pode_utilizar = Column(
        String, nullable=True)  # Todos os instrutores, Somente quem elaborou
    elaborado_por = Column(String, nullable=True)  # Nome do elaborador
    descricao = Column(Text, nullable=True)
    foto_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    favorito = Column(Boolean, default=False)
    oculto = Column(Boolean, default=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime,
                              default=datetime.utcnow,
                              onupdate=datetime.utcnow)
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=True)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    unidade = relationship("Unidade")
    criado_por = relationship("Usuario")


# ============================================================
# Modelos - Sistema de Questionários
# ============================================================


class Questionario(Base):
    __tablename__ = "questionarios"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String,
                    default="rascunho")  # rascunho, publicado, arquivado
    categoria = Column(
        String, nullable=True
    )  # avaliacao_saude, verificacao_progresso, perfil, anamnese, feedback, generico
    thumbnail_url = Column(String, nullable=True)  # URL da imagem de thumbnail
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=True)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime,
                              default=datetime.utcnow,
                              onupdate=datetime.utcnow)
    data_publicacao = Column(DateTime, nullable=True)
    configuracoes = Column(
        Text, nullable=True
    )  # JSON: {permitir_multiplas_respostas, exibir_progresso, etc}
    unidade = relationship("Unidade")
    criado_por = relationship("Usuario")
    secoes = relationship("Secao",
                          back_populates="questionario",
                          cascade="all, delete-orphan",
                          order_by="Secao.ordem")
    perguntas = relationship("Pergunta",
                             back_populates="questionario",
                             cascade="all, delete-orphan",
                             order_by="Pergunta.ordem")


class Secao(Base):
    __tablename__ = "secoes"
    id = Column(Integer, primary_key=True, index=True)
    questionario_id = Column(Integer,
                             ForeignKey("questionarios.id"),
                             nullable=False)
    titulo = Column(String,
                    nullable=True)  # Ex: "AVALIAÇÃO INICIAL - BALANCE CENTER"
    descricao = Column(Text, nullable=True)
    ordem = Column(Integer, nullable=False)
    questionario = relationship("Questionario", back_populates="secoes")
    perguntas = relationship("Pergunta",
                             back_populates="secao",
                             cascade="all, delete-orphan",
                             order_by="Pergunta.ordem")


class Pergunta(Base):
    __tablename__ = "perguntas"
    id = Column(Integer, primary_key=True, index=True)
    questionario_id = Column(Integer,
                             ForeignKey("questionarios.id"),
                             nullable=False)
    secao_id = Column(Integer, ForeignKey("secoes.id"), nullable=True)
    tipo = Column(
        String, nullable=False
    )  # texto_curto, texto_longo, multipla_escolha, selecao_multipla, likert, data, numero
    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    obrigatoria = Column(Boolean, default=False)
    ordem = Column(Integer, nullable=False)
    configuracoes = Column(
        Text, nullable=True)  # JSON: validações, placeholder, min/max, etc
    questionario = relationship("Questionario", back_populates="perguntas")
    secao = relationship("Secao", back_populates="perguntas")
    opcoes = relationship("OpcaoPergunta",
                          back_populates="pergunta",
                          cascade="all, delete-orphan",
                          order_by="OpcaoPergunta.ordem")


class OpcaoPergunta(Base):
    __tablename__ = "opcoes_perguntas"
    id = Column(Integer, primary_key=True, index=True)
    pergunta_id = Column(Integer, ForeignKey("perguntas.id"), nullable=False)
    texto = Column(String, nullable=False)
    ordem = Column(Integer, nullable=False)
    valor = Column(String, nullable=True)  # Valor da opção para scoring
    pergunta = relationship("Pergunta", back_populates="opcoes")


# ============================================================
# Modelo de Grupos - Sistema de Segmentação Inteligente
# ============================================================


class Grupo(Base):
    __tablename__ = "grupos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String, default="ativo")  # ativo, inativo
    criterios = Column(Text, nullable=True)  # JSON: regras de segmentação
    cor = Column(String, default="#62b1ca")  # Cor do grupo para visualização
    tamanho_atual = Column(Integer, default=0)  # Cache do número de membros
    crescimento_semanal = Column(Float, default=0.0)  # Variação percentual
    jornada_id = Column(Integer,
                        nullable=True)  # ID da jornada vinculada (se houver)
    automacao_ativa = Column(Boolean,
                             default=False)  # Se está conectado a automação
    tipo_grupo = Column(String,
                        default="manual")  # manual, ia_sugestao, dinamico
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=True)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime,
                              default=datetime.utcnow,
                              onupdate=datetime.utcnow)

    unidade = relationship("Unidade")
    criado_por = relationship("Usuario")


# ============================================================
# Inicializar Banco de Dados
# ============================================================

# Passo 1: Criar tabelas SEM constraint único
Base.metadata.create_all(bind=engine)


def limpar_duplicatas_attendance_startup(db: Session):
    """
    Limpa duplicatas de Attendance na inicialização
    """
    from sqlalchemy import func

    duplicatas = db.query(Attendance.reserva_aula_id,
                          func.count(Attendance.id).label('count')).group_by(
                              Attendance.reserva_aula_id).having(
                                  func.count(Attendance.id) > 1).all()

    for reserva_id, count in duplicatas:
        registros = db.query(Attendance).filter(
            Attendance.reserva_aula_id == reserva_id).order_by(
                Attendance.data_marcacao.desc()).all()

        for registro in registros[1:]:
            db.delete(registro)

    db.commit()


def criar_constraint_unico_attendance():
    """
    Cria constraint único APÓS limpeza de duplicatas
    """
    import sqlite3

    conn = sqlite3.connect("gym_wellness.db")
    cursor = conn.cursor()

    try:
        # Verificar se constraint já existe
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_unique_attendance_reserva'"
        )
        if cursor.fetchone() is None:
            # Criar constraint único
            cursor.execute(
                "CREATE UNIQUE INDEX idx_unique_attendance_reserva ON attendance(reserva_aula_id)"
            )
            conn.commit()
            print("✅ Constraint único criado em attendance.reserva_aula_id")
        else:
            print("✅ Constraint único já existe em attendance.reserva_aula_id")
    except sqlite3.IntegrityError as e:
        print(f"❌ Erro ao criar constraint: {e} - Ainda há duplicatas!")
    finally:
        conn.close()


def init_sample_data():
    db = SessionLocal()
    try:
        # Passo 2: LIMPEZA AUTOMÁTICA DE DUPLICATAS
        limpar_duplicatas_attendance_startup(db)

        # Passo 3: CRIAR CONSTRAINT ÚNICO (após limpeza)
        criar_constraint_unico_attendance()

        if db.query(Unidade).count() == 0:
            unidade = Unidade(nome="Unidade Principal",
                              endereco="Av. Principal, 123",
                              risco_desistencia=15.5)
            db.add(unidade)
            db.commit()

        if db.query(MetricaEngajamento).count() == 0:
            metrica = MetricaEngajamento(unidade_id=1,
                                         taxa_engajamento=75.0,
                                         roi=120.0,
                                         produtividade=85.0,
                                         usuarios_ativos=42)
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
                Instrutor(nome="Carlos Silva",
                          email="carlos@gym.com",
                          especialidades="Spinning, HIIT",
                          unidade_id=1),
                Instrutor(nome="Ana Martins",
                          email="ana@gym.com",
                          especialidades="Yoga, Pilates",
                          unidade_id=1),
                Instrutor(nome="João Santos",
                          email="joao@gym.com",
                          especialidades="Musculação, Funcional",
                          unidade_id=1)
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
                    unidade_id=1),
                EventoAula(nome_aula="Yoga Relaxante",
                           descricao="Sessão de yoga para relaxamento",
                           instrutor_id=2,
                           sala_id=2,
                           data_hora=datetime.utcnow() +
                           timedelta(days=1, hours=18),
                           duracao_minutos=60,
                           limite_inscricoes=15,
                           unidade_id=1),
                EventoAula(nome_aula="Treino Funcional",
                           descricao="Treino funcional de alta intensidade",
                           instrutor_id=3,
                           sala_id=3,
                           data_hora=datetime.utcnow() +
                           timedelta(days=2, hours=7),
                           duracao_minutos=50,
                           limite_inscricoes=25,
                           unidade_id=1)
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


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(
    security),
                     db: Session = Depends(get_db)) -> Usuario:
    try:
        payload = jwt.decode(credentials.credentials,
                             SECRET_KEY,
                             algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        if usuario is None:
            raise HTTPException(status_code=401,
                                detail="Usuário não encontrado")

        return usuario
    except jwt.PyJWTError:
        raise HTTPException(status_code=401,
                            detail="Token inválido ou expirado")


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
        response.headers[
            "Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    response = FileResponse("templates/index.html")
    response.headers[
        "Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.get("/demo")
async def demo():
    response = FileResponse("templates/demo.html")
    response.headers[
        "Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
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

    usuario = Usuario(email=dados.email,
                      senha=hash_senha(dados.senha),
                      nome=dados.nome,
                      tipo=dados.tipo,
                      unidade_id=dados.unidade_id)
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
def stats_overview(usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    total_usuarios = db.query(Usuario).count()
    usuarios_ativos = db.query(Usuario).filter(Usuario.ativo == True).count()
    total_visitantes = db.query(Visitante).count()

    unidades = db.query(Unidade).all()
    risco_medio = sum([u.risco_desistencia
                       for u in unidades]) / len(unidades) if unidades else 0

    programas_expirados = db.query(Programa).filter(
        Programa.status == "expirado").count()
    programas_nao_atribuidos = db.query(Programa).filter(
        Programa.status == "não atribuído").count()
    programas_atribuidos = db.query(Programa).filter(
        Programa.status == "atribuído").count()

    return {
        "risco_desistencia": round(risco_medio, 2),
        "usuarios_totais": total_usuarios,
        "visitantes": total_visitantes,
        "usuarios_ativos": usuarios_ativos,
        "programas": {
            "expirados":
            programas_expirados,
            "nao_atribuidos":
            programas_nao_atribuidos,
            "atribuidos":
            programas_atribuidos,
            "total":
            programas_expirados + programas_nao_atribuidos +
            programas_atribuidos
        }
    }


@app.get("/stats/unidade/{unidade_id}")
def stats_unidade(unidade_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    unidade = db.query(Unidade).filter(Unidade.id == unidade_id).first()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")

    usuarios = db.query(Usuario).filter(
        Usuario.unidade_id == unidade_id).count()
    usuarios_ativos = db.query(Usuario).filter(
        Usuario.unidade_id == unidade_id, Usuario.ativo == True).count()

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
def listar_agendas(usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    agendas = db.query(Agenda).filter(
        Agenda.usuario_id == usuario.id).order_by(
            Agenda.data.desc()).limit(30).all()

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
def criar_agenda(titulo: str,
                 descricao: str,
                 tipo_atividade: str,
                 duracao_minutos: int,
                 usuario: Usuario = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    agenda = Agenda(usuario_id=usuario.id,
                    titulo=titulo,
                    descricao=descricao,
                    tipo_atividade=tipo_atividade,
                    duracao_minutos=duracao_minutos)
    db.add(agenda)
    db.commit()
    db.refresh(agenda)

    return {"mensagem": "Agenda criada com sucesso!", "id": agenda.id}


@app.put("/agendas/{agenda_id}/concluir")
def concluir_agenda(agenda_id: int,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    agenda = db.query(Agenda).filter(Agenda.id == agenda_id,
                                     Agenda.usuario_id == usuario.id).first()
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda não encontrada")

    agenda.concluida = True
    db.commit()

    return {"mensagem": "Agenda concluída!"}


# ============================================================
# Endpoints de Programas
# ============================================================


@app.get("/programas")
def listar_programas(usuario: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    programas = db.query(Programa).all()
    return [{
        "id": p.id,
        "nome": p.nome,
        "status": p.status,
        "usuarios_matriculados": p.usuarios_matriculados
    } for p in programas]


@app.post("/programas/criar")
def criar_programa(nome: str,
                   descricao: str,
                   status: str,
                   unidade_id: int,
                   usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    programa = Programa(nome=nome,
                        descricao=descricao,
                        status=status,
                        unidade_id=unidade_id,
                        data_inicio=datetime.utcnow())
    db.add(programa)
    db.commit()

    return {"mensagem": "Programa criado com sucesso!", "id": programa.id}


# ============================================================
# Endpoints de Visitantes
# ============================================================


@app.post("/visitantes/registrar")
def registrar_visitante(nome: str,
                        email: str,
                        telefone: str,
                        unidade_id: int,
                        db: Session = Depends(get_db)):
    visitante = Visitante(nome=nome,
                          email=email,
                          telefone=telefone,
                          unidade_id=unidade_id)
    db.add(visitante)
    db.commit()

    return {"mensagem": "Visitante registrado com sucesso!"}


# ============================================================
# Endpoints de Unidades
# ============================================================


@app.get("/unidades")
def listar_unidades(usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    unidades = db.query(Unidade).all()
    return [{
        "id": u.id,
        "nome": u.nome,
        "endereco": u.endereco,
        "risco_desistencia": u.risco_desistencia
    } for u in unidades]


@app.post("/unidades/criar")
def criar_unidade(nome: str,
                  endereco: str,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    unidade = Unidade(nome=nome, endereco=endereco)
    db.add(unidade)
    db.commit()

    return {"mensagem": "Unidade criada com sucesso!", "id": unidade.id}


# ============================================================
# Endpoints de Métricas IA
# ============================================================


@app.get("/metricas/ia")
def metricas_ia(unidade_id: int,
                usuario: Usuario = Depends(get_current_user),
                db: Session = Depends(get_db)):
    metrica = db.query(MetricaEngajamento).filter(
        MetricaEngajamento.unidade_id == unidade_id).order_by(
            MetricaEngajamento.data.desc()).first()

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
def criar_evento_calendario(titulo: str,
                            descricao: str,
                            data_inicio: str,
                            data_fim: str,
                            tipo_evento: str,
                            lembrete: bool = False,
                            usuario: Usuario = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    evento = EventoCalendario(usuario_id=usuario.id,
                              titulo=titulo,
                              descricao=descricao,
                              data_inicio=datetime.fromisoformat(data_inicio),
                              data_fim=datetime.fromisoformat(data_fim),
                              tipo_evento=tipo_evento,
                              lembrete=lembrete)
    db.add(evento)
    db.commit()
    return {"mensagem": "Evento criado com sucesso!", "id": evento.id}


@app.get("/calendario/eventos")
def listar_eventos_calendario(data_inicio: Optional[str] = None,
                              data_fim: Optional[str] = None,
                              tipo_evento: Optional[str] = None,
                              usuario: Usuario = Depends(get_current_user),
                              db: Session = Depends(get_db)):
    query = db.query(EventoCalendario).filter(
        EventoCalendario.usuario_id == usuario.id)

    if data_inicio:
        query = query.filter(EventoCalendario.data_inicio >=
                             datetime.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(
            EventoCalendario.data_fim <= datetime.fromisoformat(data_fim))
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
def marcar_evento_cumprida(evento_id: int,
                           usuario: Usuario = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    evento = db.query(EventoCalendario).filter(
        EventoCalendario.id == evento_id,
        EventoCalendario.usuario_id == usuario.id).first()

    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    evento.status = "cumprida"
    db.commit()
    return {"mensagem": "Evento marcado como cumprido!"}


@app.delete("/calendario/eventos/{evento_id}")
def deletar_evento_calendario(evento_id: int,
                              usuario: Usuario = Depends(get_current_user),
                              db: Session = Depends(get_db)):
    evento = db.query(EventoCalendario).filter(
        EventoCalendario.id == evento_id,
        EventoCalendario.usuario_id == usuario.id).first()

    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    db.delete(evento)
    db.commit()
    return {"mensagem": "Evento deletado com sucesso!"}


# ============================================================
# Endpoints de Salas
# ============================================================


@app.get("/salas")
def listar_salas(usuario: Usuario = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    salas = db.query(Sala).filter(Sala.ativa == True).all()
    return [{
        "id": s.id,
        "nome": s.nome,
        "capacidade": s.capacidade,
        "unidade_id": s.unidade_id
    } for s in salas]


@app.post("/salas/criar")
def criar_sala(nome: str,
               capacidade: int,
               unidade_id: int,
               usuario: Usuario = Depends(get_current_user),
               db: Session = Depends(get_db)):
    sala = Sala(nome=nome, capacidade=capacidade, unidade_id=unidade_id)
    db.add(sala)
    db.commit()
    return {"mensagem": "Sala criada com sucesso!", "id": sala.id}


# ============================================================
# Endpoints de Instrutores
# ============================================================


@app.get("/instrutores")
def listar_instrutores(usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    instrutores = db.query(Instrutor).filter(Instrutor.ativo == True).all()
    return [{
        "id": i.id,
        "nome": i.nome,
        "email": i.email,
        "especialidades": i.especialidades,
        "foto_url": i.foto_url
    } for i in instrutores]


@app.post("/instrutores/criar")
def criar_instrutor(nome: str,
                    email: str,
                    especialidades: str,
                    unidade_id: int,
                    foto_url: str = None,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    instrutor = Instrutor(nome=nome,
                          email=email,
                          especialidades=especialidades,
                          unidade_id=unidade_id,
                          foto_url=foto_url)
    db.add(instrutor)
    db.commit()
    return {"mensagem": "Instrutor criado com sucesso!", "id": instrutor.id}


# ============================================================
# Endpoints de Agendamento de Aulas
# ============================================================


@app.post("/aulas/criar")
def criar_evento_aula(nome_aula: str,
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
                      db: Session = Depends(get_db)):
    evento = EventoAula(nome_aula=nome_aula,
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
                        unidade_id=usuario.unidade_id or 1)
    db.add(evento)
    db.commit()
    return {"mensagem": "Aula criada com sucesso!", "id": evento.id}


@app.get("/aulas")
def listar_aulas(sala_id: Optional[int] = None,
                 instrutor_id: Optional[int] = None,
                 data_inicio: Optional[str] = None,
                 data_fim: Optional[str] = None,
                 usuario: Usuario = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    query = db.query(EventoAula).filter(EventoAula.ativa == True)

    if sala_id:
        query = query.filter(EventoAula.sala_id == sala_id)
    if instrutor_id:
        query = query.filter(EventoAula.instrutor_id == instrutor_id)
    if data_inicio:
        query = query.filter(
            EventoAula.data_hora >= datetime.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(
            EventoAula.data_hora <= datetime.fromisoformat(data_fim))

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
def reservar_aula(aula_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    reservas_ativas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id,
        ReservaAula.cancelada == False).count()

    if reservas_ativas >= aula.limite_inscricoes:
        raise HTTPException(status_code=400, detail="Aula lotada")

    reserva_existente = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id,
        ReservaAula.usuario_id == usuario.id,
        ReservaAula.cancelada == False).first()

    if reserva_existente:
        raise HTTPException(status_code=400,
                            detail="Você já reservou esta aula")

    reserva = ReservaAula(evento_aula_id=aula_id, usuario_id=usuario.id)
    db.add(reserva)
    db.commit()

    return {"mensagem": "Reserva realizada com sucesso!", "id": reserva.id}


@app.get("/aulas/{aula_id}/reservas")
def listar_reservas_aula(aula_id: int,
                         usuario: Usuario = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    reservas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id).all()

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
    status: str,  # presente, falta, justificada
    observacoes: str = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)):
    reserva = db.query(ReservaAula).filter(
        ReservaAula.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    # Validar status
    if status not in ["presente", "falta", "justificada"]:
        raise HTTPException(
            status_code=400,
            detail="Status deve ser: presente, falta ou justificada")

    # Atualizar campo legado na reserva (para compatibilidade)
    reserva.presente = (status == "presente")

    # GARANTIR UNICIDADE: Deletar TODOS os registros existentes de Attendance para esta reserva
    db.query(Attendance).filter(
        Attendance.reserva_aula_id == reserva.id).delete()

    # Criar NOVO registro único e autoritativo
    attendance = Attendance(reserva_aula_id=reserva.id,
                            evento_aula_id=reserva.evento_aula_id,
                            usuario_id=reserva.usuario_id,
                            status=status,
                            observacoes=observacoes,
                            marcado_por=usuario.id)
    db.add(attendance)
    db.commit()

    return {
        "mensagem": "Presença registrada com sucesso!",
        "attendance_id": attendance.id,
        "status": status
    }


@app.delete("/aulas/reservas/{reserva_id}/cancelar")
def cancelar_reserva(reserva_id: int,
                     usuario: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    reserva = db.query(ReservaAula).filter(
        ReservaAula.id == reserva_id,
        ReservaAula.usuario_id == usuario.id).first()

    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    reserva.cancelada = True
    reserva.data_cancelamento = datetime.utcnow()
    db.commit()
    return {"mensagem": "Reserva cancelada com sucesso!"}


# ============================================================
# Endpoint de Limpeza de Duplicatas (Administração)
# ============================================================


@app.post("/admin/attendance/limpar-duplicatas")
def limpar_duplicatas_attendance(usuario: Usuario = Depends(get_current_user),
                                 db: Session = Depends(get_db)):
    """
    Remove registros duplicados de Attendance, mantendo apenas o mais recente por reserva
    """
    # Buscar todas as reservas com mais de um registro de Attendance
    from sqlalchemy import func

    duplicatas = db.query(Attendance.reserva_aula_id,
                          func.count(Attendance.id).label('count')).group_by(
                              Attendance.reserva_aula_id).having(
                                  func.count(Attendance.id) > 1).all()

    total_removidos = 0

    for reserva_id, count in duplicatas:
        # Buscar todos os registros desta reserva
        registros = db.query(Attendance).filter(
            Attendance.reserva_aula_id == reserva_id).order_by(
                Attendance.data_marcacao.desc()).all()

        # Manter o mais recente, deletar os outros
        for registro in registros[1:]:
            db.delete(registro)
            total_removidos += 1

    db.commit()

    return {
        "mensagem": "Duplicatas removidas com sucesso!",
        "reservas_afetadas": len(duplicatas),
        "registros_removidos": total_removidos
    }


# ============================================================
# Endpoints de Attendance (Presença Detalhada)
# ============================================================


@app.get("/aulas/{aula_id}/attendance")
def listar_attendance_aula(aula_id: int,
                           usuario: Usuario = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    """
    Lista todos os registros de presença de uma aula
    """
    attendance_records = db.query(Attendance).filter(
        Attendance.evento_aula_id == aula_id).all()

    return [{
        "id":
        a.id,
        "usuario":
        a.usuario.nome if a.usuario else "Desconhecido",
        "status":
        a.status,
        "data_marcacao":
        a.data_marcacao.isoformat() if a.data_marcacao else None,
        "observacoes":
        a.observacoes,
        "marcado_por":
        a.marcador.nome if a.marcador else "Sistema"
    } for a in attendance_records]


@app.get("/usuarios/{usuario_id}/attendance")
def listar_attendance_usuario(usuario_id: int,
                              data_inicio: Optional[str] = None,
                              data_fim: Optional[str] = None,
                              usuario: Usuario = Depends(get_current_user),
                              db: Session = Depends(get_db)):
    """
    Lista histórico de presença de um usuário
    """
    query = db.query(Attendance).filter(Attendance.usuario_id == usuario_id)

    if data_inicio:
        query = query.filter(
            Attendance.data_marcacao >= datetime.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(
            Attendance.data_marcacao <= datetime.fromisoformat(data_fim))

    attendance_records = query.order_by(Attendance.data_marcacao.desc()).all()

    return [{
        "id":
        a.id,
        "aula":
        a.evento_aula.nome_aula if a.evento_aula else "N/A",
        "status":
        a.status,
        "data_marcacao":
        a.data_marcacao.isoformat() if a.data_marcacao else None,
        "observacoes":
        a.observacoes
    } for a in attendance_records]


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
            await aiosmtplib.send(message,
                                  hostname=smtp_host,
                                  port=smtp_port,
                                  username=smtp_user,
                                  password=smtp_pass,
                                  start_tls=True)
            return True
        return False
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return False


@app.post("/aulas/{aula_id}/enviar-email-inscritos")
async def enviar_email_inscritos(aula_id: int,
                                 assunto: str,
                                 mensagem: str,
                                 usuario: Usuario = Depends(get_current_user),
                                 db: Session = Depends(get_db)):
    """
    Envia e-mail para todos os inscritos em uma aula
    """
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    reservas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id,
        ReservaAula.cancelada == False).all()

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
            sucesso = await enviar_email(reserva.usuario.email, assunto,
                                         corpo_email)
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
    plt.pie(sizes,
            labels=labels,
            colors=colors[:len(labels)],
            autopct='%1.1f%%',
            startangle=90)
    plt.axis('equal')

    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()

    return f"data:image/png;base64,{image_base64}"


@app.get("/aulas/{aula_id}/grafico")
def grafico_aula(aula_id: int,
                 usuario: Usuario = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    """
    Gera gráfico circular com estatísticas da aula (usando Attendance)
    """
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    # Usar SOMENTE Attendance como fonte autoritativa
    attendance_records = db.query(Attendance).filter(
        Attendance.evento_aula_id == aula_id).all()
    reservas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id).all()

    total_inscricoes = len([r for r in reservas if not r.cancelada])

    # Calcular SOMENTE usando Attendance
    total_presentes = len(
        [a for a in attendance_records if a.status == "presente"])
    total_faltas = len([a for a in attendance_records if a.status == "falta"])
    total_justificadas = len(
        [a for a in attendance_records if a.status == "justificada"])

    vagas_disponiveis = aula.limite_inscricoes - total_inscricoes

    dados_grafico = {
        "Presentes": total_presentes,
        "Faltas": total_faltas,
        "Justificadas": total_justificadas,
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
def exportar_calendario_csv(data_inicio: str,
                            data_fim: str,
                            usuario: Usuario = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """
    Exporta eventos do calendário em CSV
    """
    eventos = db.query(EventoCalendario).filter(
        EventoCalendario.usuario_id == usuario.id, EventoCalendario.data_inicio
        >= datetime.fromisoformat(data_inicio), EventoCalendario.data_fim
        <= datetime.fromisoformat(data_fim)).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Cabeçalho
    writer.writerow([
        'ID', 'Título', 'Descrição', 'Data Início', 'Data Fim', 'Tipo',
        'Status'
    ])

    # Dados
    for e in eventos:
        writer.writerow([
            e.id, e.titulo, e.descricao,
            e.data_inicio.isoformat() if e.data_inicio else '',
            e.data_fim.isoformat() if e.data_fim else '', e.tipo_evento,
            e.status
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename=calendario_{data_inicio}_{data_fim}.csv"
        })


@app.get("/aulas/exportar-csv")
def exportar_aulas_csv(data_inicio: str,
                       data_fim: str,
                       usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """
    Exporta aulas em CSV
    """
    aulas = db.query(EventoAula).filter(
        EventoAula.ativa == True, EventoAula.data_hora
        >= datetime.fromisoformat(data_inicio), EventoAula.data_hora
        <= datetime.fromisoformat(data_fim)).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Cabeçalho
    writer.writerow([
        'ID', 'Aula', 'Instrutor', 'Sala', 'Data/Hora', 'Duração', 'Limite',
        'Inscritos'
    ])

    # Dados
    for a in aulas:
        writer.writerow([
            a.id, a.nome_aula, a.instrutor.nome if a.instrutor else '',
            a.sala.nome if a.sala else '',
            a.data_hora.isoformat() if a.data_hora else '', a.duracao_minutos,
            a.limite_inscricoes,
            len([r for r in a.reservas if not r.cancelada])
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename=aulas_{data_inicio}_{data_fim}.csv"
        })


# ============================================================
# Endpoints de Estatísticas e Relatórios
# ============================================================


@app.get("/aulas/{aula_id}/estatisticas")
def estatisticas_aula(aula_id: int,
                      usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    # Usar SOMENTE Attendance como fonte autoritativa
    attendance_records = db.query(Attendance).filter(
        Attendance.evento_aula_id == aula_id).all()
    reservas = db.query(ReservaAula).filter(
        ReservaAula.evento_aula_id == aula_id).all()

    total_inscricoes = len([r for r in reservas if not r.cancelada])
    total_canceladas = len([r for r in reservas if r.cancelada])

    # Calcular presença/faltas SOMENTE usando Attendance
    total_presentes = len(
        [a for a in attendance_records if a.status == "presente"])
    total_faltas = len([a for a in attendance_records if a.status == "falta"])
    total_justificadas = len(
        [a for a in attendance_records if a.status == "justificada"])

    ocupacao_percentual = (total_inscricoes / aula.limite_inscricoes *
                           100) if aula.limite_inscricoes > 0 else 0

    return {
        "aula_id": aula_id,
        "nome_aula": aula.nome_aula,
        "limite_inscricoes": aula.limite_inscricoes,
        "total_inscricoes": total_inscricoes,
        "total_presentes": total_presentes,
        "total_faltas": total_faltas,
        "total_justificadas": total_justificadas,
        "total_canceladas": total_canceladas,
        "ocupacao_percentual": round(ocupacao_percentual, 2),
        "vagas_disponiveis": aula.limite_inscricoes - total_inscricoes
    }


# ============================================================
# Endpoints de Exercícios
# ============================================================


class ExercicioCreate(BaseModel):
    nome: str
    tipo: Optional[str] = None
    quem_pode_utilizar: Optional[str] = None
    elaborado_por: Optional[str] = None
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    video_url: Optional[str] = None
    favorito: bool = False
    oculto: bool = False


class ExercicioUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    quem_pode_utilizar: Optional[str] = None
    elaborado_por: Optional[str] = None
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    video_url: Optional[str] = None
    favorito: Optional[bool] = None
    oculto: Optional[bool] = None


@app.post("/exercicios")
def criar_exercicio(exercicio: ExercicioCreate,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    novo_exercicio = Exercicio(nome=exercicio.nome,
                               tipo=exercicio.tipo,
                               quem_pode_utilizar=exercicio.quem_pode_utilizar,
                               elaborado_por=exercicio.elaborado_por,
                               descricao=exercicio.descricao,
                               foto_url=exercicio.foto_url,
                               video_url=exercicio.video_url,
                               favorito=exercicio.favorito,
                               oculto=exercicio.oculto,
                               unidade_id=usuario.unidade_id,
                               criado_por_id=usuario.id)
    db.add(novo_exercicio)
    db.commit()
    db.refresh(novo_exercicio)
    return {
        "id":
        novo_exercicio.id,
        "nome":
        novo_exercicio.nome,
        "tipo":
        novo_exercicio.tipo,
        "quem_pode_utilizar":
        novo_exercicio.quem_pode_utilizar,
        "elaborado_por":
        novo_exercicio.elaborado_por,
        "descricao":
        novo_exercicio.descricao,
        "foto_url":
        novo_exercicio.foto_url,
        "video_url":
        novo_exercicio.video_url,
        "favorito":
        novo_exercicio.favorito,
        "oculto":
        novo_exercicio.oculto,
        "data_criacao":
        novo_exercicio.data_criacao.isoformat()
        if novo_exercicio.data_criacao else None
    }


@app.get("/exercicios")
def listar_exercicios(busca: Optional[str] = None,
                      tipo: Optional[str] = None,
                      favoritos: Optional[bool] = None,
                      ocultos: Optional[bool] = False,
                      ordenar: Optional[str] = "nome",
                      usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    query = db.query(Exercicio)

    if not ocultos:
        query = query.filter(Exercicio.oculto == False)

    if busca:
        query = query.filter(Exercicio.nome.ilike(f"%{busca}%"))

    if tipo:
        query = query.filter(Exercicio.tipo == tipo)

    if favoritos is not None:
        query = query.filter(Exercicio.favorito == favoritos)

    if ordenar == "nome":
        query = query.order_by(Exercicio.nome)
    elif ordenar == "recentes":
        query = query.order_by(Exercicio.data_criacao.desc())

    exercicios = query.all()

    return [{
        "id":
        ex.id,
        "nome":
        ex.nome,
        "tipo":
        ex.tipo,
        "quem_pode_utilizar":
        ex.quem_pode_utilizar,
        "elaborado_por":
        ex.elaborado_por,
        "descricao":
        ex.descricao,
        "foto_url":
        ex.foto_url,
        "video_url":
        ex.video_url,
        "favorito":
        ex.favorito,
        "oculto":
        ex.oculto,
        "data_criacao":
        ex.data_criacao.isoformat() if ex.data_criacao else None
    } for ex in exercicios]


@app.get("/exercicios/{exercicio_id}")
def obter_exercicio(exercicio_id: int,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    exercicio = db.query(Exercicio).filter(
        Exercicio.id == exercicio_id).first()
    if not exercicio:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")

    return {
        "id":
        exercicio.id,
        "nome":
        exercicio.nome,
        "tipo":
        exercicio.tipo,
        "quem_pode_utilizar":
        exercicio.quem_pode_utilizar,
        "elaborado_por":
        exercicio.elaborado_por,
        "descricao":
        exercicio.descricao,
        "foto_url":
        exercicio.foto_url,
        "video_url":
        exercicio.video_url,
        "favorito":
        exercicio.favorito,
        "oculto":
        exercicio.oculto,
        "data_criacao":
        exercicio.data_criacao.isoformat() if exercicio.data_criacao else None,
        "data_atualizacao":
        exercicio.data_atualizacao.isoformat()
        if exercicio.data_atualizacao else None
    }


@app.put("/exercicios/{exercicio_id}")
def atualizar_exercicio(exercicio_id: int,
                        dados: ExercicioUpdate,
                        usuario: Usuario = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    exercicio = db.query(Exercicio).filter(
        Exercicio.id == exercicio_id).first()
    if not exercicio:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")

    if dados.nome is not None:
        exercicio.nome = dados.nome
    if dados.tipo is not None:
        exercicio.tipo = dados.tipo
    if dados.quem_pode_utilizar is not None:
        exercicio.quem_pode_utilizar = dados.quem_pode_utilizar
    if dados.elaborado_por is not None:
        exercicio.elaborado_por = dados.elaborado_por
    if dados.descricao is not None:
        exercicio.descricao = dados.descricao
    if dados.foto_url is not None:
        exercicio.foto_url = dados.foto_url
    if dados.video_url is not None:
        exercicio.video_url = dados.video_url
    if dados.favorito is not None:
        exercicio.favorito = dados.favorito
    if dados.oculto is not None:
        exercicio.oculto = dados.oculto

    exercicio.data_atualizacao = datetime.utcnow()
    db.commit()
    db.refresh(exercicio)

    return {
        "id": exercicio.id,
        "nome": exercicio.nome,
        "tipo": exercicio.tipo,
        "favorito": exercicio.favorito,
        "oculto": exercicio.oculto
    }


@app.delete("/exercicios/{exercicio_id}")
def deletar_exercicio(exercicio_id: int,
                      usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    exercicio = db.query(Exercicio).filter(
        Exercicio.id == exercicio_id).first()
    if not exercicio:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")

    db.delete(exercicio)
    db.commit()
    return {"mensagem": "Exercício excluído com sucesso"}


import shutil
from pathlib import Path

# Criar diretórios para uploads se não existirem
UPLOAD_DIR = Path("static/uploads")
EXERCICIOS_FOTOS_DIR = UPLOAD_DIR / "exercicios" / "fotos"
EXERCICIOS_VIDEOS_DIR = UPLOAD_DIR / "exercicios" / "videos"
EXERCICIOS_FOTOS_DIR.mkdir(parents=True, exist_ok=True)
EXERCICIOS_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


@app.post("/exercicios/upload-foto")
async def upload_foto_exercicio(file: UploadFile = File(...),
                                usuario: Usuario = Depends(get_current_user)):
    # Validar tipo de arquivo
    allowed_types = ["image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Formato não permitido. Use JPG, JPEG ou PNG")

    # Gerar nome único do arquivo
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{datetime.utcnow().timestamp()}_{usuario.id}.{file_extension}"
    file_path = EXERCICIOS_FOTOS_DIR / unique_filename

    # Salvar arquivo
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Retornar URL relativa
    relative_url = f"/static/uploads/exercicios/fotos/{unique_filename}"
    return {"foto_url": relative_url, "mensagem": "Foto enviada com sucesso"}


@app.post("/exercicios/upload-video")
async def upload_video_exercicio(file: UploadFile = File(...),
                                 usuario: Usuario = Depends(get_current_user)):
    # Validar tipo de arquivo
    allowed_types = ["video/mp4", "video/webm", "video/quicktime"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Formato não permitido. Use MP4, WEBM ou MOV")

    # Validar tamanho (40 MB máximo)
    max_size = 40 * 1024 * 1024  # 40 MB em bytes
    file.file.seek(0, 2)  # Ir para o final do arquivo
    file_size = file.file.tell()
    file.file.seek(0)  # Voltar para o início

    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail="Arquivo muito grande. Tamanho máximo: 40 MB")

    # Gerar nome único do arquivo
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{datetime.utcnow().timestamp()}_{usuario.id}.{file_extension}"
    file_path = EXERCICIOS_VIDEOS_DIR / unique_filename

    # Salvar arquivo
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Retornar URL relativa
    relative_url = f"/static/uploads/exercicios/videos/{unique_filename}"
    return {"video_url": relative_url, "mensagem": "Vídeo enviado com sucesso"}


# ============================================================
# Endpoints de Questionários
# ============================================================

import json


class SecaoCreate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    ordem: int


class SecaoUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    ordem: Optional[int] = None


class OpcaoPerguntaCreate(BaseModel):
    texto: str
    ordem: int
    valor: Optional[str] = None


class PerguntaCreate(BaseModel):
    tipo: str
    titulo: str
    descricao: Optional[str] = None
    obrigatoria: bool = False
    ordem: int
    secao_id: Optional[int] = None
    configuracoes: Optional[dict] = None
    opcoes: Optional[List[OpcaoPerguntaCreate]] = []


class QuestionarioCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    thumbnail_url: Optional[str] = None
    configuracoes: Optional[dict] = None


class QuestionarioUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    categoria: Optional[str] = None
    thumbnail_url: Optional[str] = None
    configuracoes: Optional[dict] = None


# ============================================================
# Schemas Pydantic - Grupos
# ============================================================


class GrupoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    status: str = "ativo"
    criterios: Optional[dict] = None
    cor: str = "#62b1ca"
    jornada_id: Optional[int] = None
    automacao_ativa: bool = False
    tipo_grupo: str = "manual"


class GrupoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    criterios: Optional[dict] = None
    cor: Optional[str] = None
    jornada_id: Optional[int] = None
    automacao_ativa: Optional[bool] = None
    tamanho_atual: Optional[int] = None
    crescimento_semanal: Optional[float] = None


@app.get("/questionarios")
def listar_questionarios(usuario: Usuario = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    questionarios = db.query(Questionario).filter(
        Questionario.criado_por_id == usuario.id).order_by(
            Questionario.data_criacao.desc()).all()

    resultado = []
    for q in questionarios:
        resultado.append({
            "id":
            q.id,
            "titulo":
            q.titulo,
            "descricao":
            q.descricao,
            "status":
            q.status,
            "categoria":
            q.categoria,
            "thumbnail_url":
            q.thumbnail_url,
            "data_criacao":
            q.data_criacao.isoformat(),
            "data_atualizacao":
            q.data_atualizacao.isoformat(),
            "data_publicacao":
            q.data_publicacao.isoformat() if q.data_publicacao else None,
            "total_perguntas":
            len(q.perguntas)
        })

    return resultado


@app.post("/questionarios")
def criar_questionario(dados: QuestionarioCreate,
                       usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    questionario = Questionario(titulo=dados.titulo,
                                descricao=dados.descricao,
                                categoria=dados.categoria,
                                thumbnail_url=dados.thumbnail_url,
                                status="rascunho",
                                unidade_id=usuario.unidade_id,
                                criado_por_id=usuario.id,
                                configuracoes=json.dumps(dados.configuracoes)
                                if dados.configuracoes else None)

    db.add(questionario)
    db.commit()
    db.refresh(questionario)

    return {
        "id": questionario.id,
        "titulo": questionario.titulo,
        "descricao": questionario.descricao,
        "status": questionario.status,
        "data_criacao": questionario.data_criacao.isoformat(),
        "mensagem": "Questionário criado com sucesso"
    }


@app.get("/questionarios/{questionario_id}")
def obter_questionario(questionario_id: int,
                       usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    questionario = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    perguntas = []
    for p in questionario.perguntas:
        opcoes = []
        for o in p.opcoes:
            opcoes.append({
                "id": o.id,
                "texto": o.texto,
                "ordem": o.ordem,
                "valor": o.valor
            })

        perguntas.append({
            "id": p.id,
            "tipo": p.tipo,
            "titulo": p.titulo,
            "descricao": p.descricao,
            "obrigatoria": p.obrigatoria,
            "ordem": p.ordem,
            "configuracoes":
            json.loads(p.configuracoes) if p.configuracoes else {},
            "opcoes": opcoes
        })

    return {
        "id":
        questionario.id,
        "titulo":
        questionario.titulo,
        "descricao":
        questionario.descricao,
        "status":
        questionario.status,
        "categoria":
        questionario.categoria,
        "thumbnail_url":
        questionario.thumbnail_url,
        "data_criacao":
        questionario.data_criacao.isoformat(),
        "data_atualizacao":
        questionario.data_atualizacao.isoformat(),
        "data_publicacao":
        questionario.data_publicacao.isoformat()
        if questionario.data_publicacao else None,
        "configuracoes":
        json.loads(questionario.configuracoes)
        if questionario.configuracoes else {},
        "perguntas":
        perguntas
    }


@app.put("/questionarios/{questionario_id}")
def atualizar_questionario(questionario_id: int,
                           dados: QuestionarioUpdate,
                           usuario: Usuario = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    questionario = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    if dados.titulo is not None:
        questionario.titulo = dados.titulo
    if dados.descricao is not None:
        questionario.descricao = dados.descricao
    if dados.categoria is not None:
        questionario.categoria = dados.categoria
    if dados.thumbnail_url is not None:
        questionario.thumbnail_url = dados.thumbnail_url
    if dados.status is not None:
        questionario.status = dados.status
        if dados.status == "publicado" and not questionario.data_publicacao:
            questionario.data_publicacao = datetime.utcnow()
    if dados.configuracoes is not None:
        questionario.configuracoes = json.dumps(dados.configuracoes)

    questionario.data_atualizacao = datetime.utcnow()
    db.commit()

    return {"mensagem": "Questionário atualizado com sucesso"}


@app.delete("/questionarios/{questionario_id}")
def deletar_questionario(questionario_id: int,
                         usuario: Usuario = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    questionario = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    db.delete(questionario)
    db.commit()

    return {"mensagem": "Questionário excluído com sucesso"}


# ============================================================
# Endpoints de Seções
# ============================================================


@app.get("/questionarios/{questionario_id}/secoes")
def listar_secoes(questionario_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    questionario = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    secoes = db.query(Secao).filter(
        Secao.questionario_id == questionario_id).order_by(Secao.ordem).all()

    resultado = []
    for secao in secoes:
        perguntas = []
        for p in secao.perguntas:
            perguntas.append({
                "id": p.id,
                "tipo": p.tipo,
                "titulo": p.titulo,
                "descricao": p.descricao,
                "obrigatoria": p.obrigatoria,
                "ordem": p.ordem,
                "configuracoes":
                json.loads(p.configuracoes) if p.configuracoes else {}
            })

        resultado.append({
            "id": secao.id,
            "titulo": secao.titulo,
            "descricao": secao.descricao,
            "ordem": secao.ordem,
            "perguntas": perguntas
        })

    return resultado


@app.post("/questionarios/{questionario_id}/secoes")
def criar_secao(questionario_id: int,
                dados: SecaoCreate,
                usuario: Usuario = Depends(get_current_user),
                db: Session = Depends(get_db)):
    questionario = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    secao = Secao(questionario_id=questionario_id,
                  titulo=dados.titulo,
                  descricao=dados.descricao,
                  ordem=dados.ordem)

    db.add(secao)
    db.commit()
    db.refresh(secao)

    return {
        "id": secao.id,
        "titulo": secao.titulo,
        "descricao": secao.descricao,
        "ordem": secao.ordem,
        "perguntas": []
    }


@app.put("/questionarios/{questionario_id}/secoes/{secao_id}")
def atualizar_secao(questionario_id: int,
                    secao_id: int,
                    dados: SecaoUpdate,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    secao = db.query(Secao).join(Questionario).filter(
        Secao.id == secao_id, Secao.questionario_id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not secao:
        raise HTTPException(status_code=404, detail="Seção não encontrada")

    if dados.titulo is not None:
        secao.titulo = dados.titulo
    if dados.descricao is not None:
        secao.descricao = dados.descricao
    if dados.ordem is not None:
        secao.ordem = dados.ordem

    db.commit()

    return {"mensagem": "Seção atualizada com sucesso"}


@app.delete("/questionarios/{questionario_id}/secoes/{secao_id}")
def deletar_secao(questionario_id: int,
                  secao_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    secao = db.query(Secao).join(Questionario).filter(
        Secao.id == secao_id, Secao.questionario_id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not secao:
        raise HTTPException(status_code=404, detail="Seção não encontrada")

    db.delete(secao)
    db.commit()

    return {"mensagem": "Seção excluída com sucesso"}


# ============================================================
# Endpoints de Perguntas
# ============================================================


@app.post("/questionarios/{questionario_id}/perguntas")
def adicionar_pergunta(questionario_id: int,
                       dados: PerguntaCreate,
                       usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    questionario = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    pergunta = Pergunta(questionario_id=questionario_id,
                        secao_id=dados.secao_id,
                        tipo=dados.tipo,
                        titulo=dados.titulo,
                        descricao=dados.descricao,
                        obrigatoria=dados.obrigatoria,
                        ordem=dados.ordem,
                        configuracoes=json.dumps(dados.configuracoes)
                        if dados.configuracoes else None)

    db.add(pergunta)
    db.commit()
    db.refresh(pergunta)

    if dados.opcoes:
        for opcao_data in dados.opcoes:
            opcao = OpcaoPergunta(pergunta_id=pergunta.id,
                                  texto=opcao_data.texto,
                                  ordem=opcao_data.ordem,
                                  valor=opcao_data.valor)
            db.add(opcao)
        db.commit()

    questionario.data_atualizacao = datetime.utcnow()
    db.commit()

    return {"id": pergunta.id, "mensagem": "Pergunta adicionada com sucesso"}


@app.put("/perguntas/{pergunta_id}")
def atualizar_pergunta(pergunta_id: int,
                       dados: PerguntaCreate,
                       usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    pergunta = db.query(Pergunta).join(Questionario).filter(
        Pergunta.id == pergunta_id,
        Questionario.criado_por_id == usuario.id).first()

    if not pergunta:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")

    pergunta.tipo = dados.tipo
    pergunta.titulo = dados.titulo
    pergunta.descricao = dados.descricao
    pergunta.obrigatoria = dados.obrigatoria
    pergunta.ordem = dados.ordem
    pergunta.configuracoes = json.dumps(
        dados.configuracoes) if dados.configuracoes else None

    db.query(OpcaoPergunta).filter(
        OpcaoPergunta.pergunta_id == pergunta_id).delete()

    if dados.opcoes:
        for opcao_data in dados.opcoes:
            opcao = OpcaoPergunta(pergunta_id=pergunta.id,
                                  texto=opcao_data.texto,
                                  ordem=opcao_data.ordem,
                                  valor=opcao_data.valor)
            db.add(opcao)

    pergunta.questionario.data_atualizacao = datetime.utcnow()
    db.commit()

    return {"mensagem": "Pergunta atualizada com sucesso"}


@app.delete("/perguntas/{pergunta_id}")
def deletar_pergunta(pergunta_id: int,
                     usuario: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    pergunta = db.query(Pergunta).join(Questionario).filter(
        Pergunta.id == pergunta_id,
        Questionario.criado_por_id == usuario.id).first()

    if not pergunta:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")

    questionario = pergunta.questionario
    db.delete(pergunta)
    questionario.data_atualizacao = datetime.utcnow()
    db.commit()

    return {"mensagem": "Pergunta excluída com sucesso"}


@app.post("/questionarios/{questionario_id}/duplicar")
def duplicar_questionario(questionario_id: int,
                          usuario: Usuario = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    questionario_original = db.query(Questionario).filter(
        Questionario.id == questionario_id,
        Questionario.criado_por_id == usuario.id).first()

    if not questionario_original:
        raise HTTPException(status_code=404,
                            detail="Questionário não encontrado")

    novo_questionario = Questionario(
        titulo=f"{questionario_original.titulo} (Cópia)",
        descricao=questionario_original.descricao,
        status="rascunho",
        unidade_id=questionario_original.unidade_id,
        criado_por_id=usuario.id,
        configuracoes=questionario_original.configuracoes)

    db.add(novo_questionario)
    db.commit()
    db.refresh(novo_questionario)

    for pergunta_original in questionario_original.perguntas:
        nova_pergunta = Pergunta(questionario_id=novo_questionario.id,
                                 tipo=pergunta_original.tipo,
                                 titulo=pergunta_original.titulo,
                                 descricao=pergunta_original.descricao,
                                 obrigatoria=pergunta_original.obrigatoria,
                                 ordem=pergunta_original.ordem,
                                 configuracoes=pergunta_original.configuracoes)
        db.add(nova_pergunta)
        db.commit()
        db.refresh(nova_pergunta)

        for opcao_original in pergunta_original.opcoes:
            nova_opcao = OpcaoPergunta(pergunta_id=nova_pergunta.id,
                                       texto=opcao_original.texto,
                                       ordem=opcao_original.ordem,
                                       valor=opcao_original.valor)
            db.add(nova_opcao)

    db.commit()

    return {
        "id": novo_questionario.id,
        "mensagem": "Questionário duplicado com sucesso"
    }


# ============================================================
# Endpoints de Grupos - Sistema de Segmentação Inteligente
# ============================================================


@app.get("/grupos")
def listar_grupos(usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Lista todos os grupos do usuário"""
    grupos = db.query(Grupo).filter(
        Grupo.criado_por_id == usuario.id).order_by(
            Grupo.data_criacao.desc()).all()

    resultado = []
    for g in grupos:
        resultado.append({
            "id": g.id,
            "nome": g.nome,
            "descricao": g.descricao,
            "status": g.status,
            "criterios": json.loads(g.criterios) if g.criterios else {},
            "cor": g.cor,
            "tamanho_atual": g.tamanho_atual,
            "crescimento_semanal": g.crescimento_semanal,
            "jornada_id": g.jornada_id,
            "automacao_ativa": g.automacao_ativa,
            "tipo_grupo": g.tipo_grupo,
            "data_criacao": g.data_criacao.isoformat(),
            "data_atualizacao": g.data_atualizacao.isoformat()
        })

    return resultado


@app.post("/grupos")
def criar_grupo(dados: GrupoCreate,
                usuario: Usuario = Depends(get_current_user),
                db: Session = Depends(get_db)):
    """Cria um novo grupo"""
    grupo = Grupo(
        nome=dados.nome,
        descricao=dados.descricao,
        status=dados.status,
        criterios=json.dumps(dados.criterios) if dados.criterios else None,
        cor=dados.cor,
        jornada_id=dados.jornada_id,
        automacao_ativa=dados.automacao_ativa,
        tipo_grupo=dados.tipo_grupo,
        unidade_id=usuario.unidade_id,
        criado_por_id=usuario.id)

    db.add(grupo)
    db.commit()
    db.refresh(grupo)

    return {"id": grupo.id, "mensagem": "Grupo criado com sucesso"}


@app.get("/grupos/{grupo_id}")
def obter_grupo(grupo_id: int,
                usuario: Usuario = Depends(get_current_user),
                db: Session = Depends(get_db)):
    """Obtém detalhes de um grupo específico"""
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id,
                                   Grupo.criado_por_id == usuario.id).first()

    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    return {
        "id": grupo.id,
        "nome": grupo.nome,
        "descricao": grupo.descricao,
        "status": grupo.status,
        "criterios": json.loads(grupo.criterios) if grupo.criterios else {},
        "cor": grupo.cor,
        "tamanho_atual": grupo.tamanho_atual,
        "crescimento_semanal": grupo.crescimento_semanal,
        "jornada_id": grupo.jornada_id,
        "automacao_ativa": grupo.automacao_ativa,
        "tipo_grupo": grupo.tipo_grupo,
        "data_criacao": grupo.data_criacao.isoformat(),
        "data_atualizacao": grupo.data_atualizacao.isoformat()
    }


@app.put("/grupos/{grupo_id}")
def atualizar_grupo(grupo_id: int,
                    dados: GrupoUpdate,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Atualiza um grupo existente"""
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id,
                                   Grupo.criado_por_id == usuario.id).first()

    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    if dados.nome is not None:
        grupo.nome = dados.nome
    if dados.descricao is not None:
        grupo.descricao = dados.descricao
    if dados.status is not None:
        grupo.status = dados.status
    if dados.criterios is not None:
        grupo.criterios = json.dumps(dados.criterios)
    if dados.cor is not None:
        grupo.cor = dados.cor
    if dados.jornada_id is not None:
        grupo.jornada_id = dados.jornada_id
    if dados.automacao_ativa is not None:
        grupo.automacao_ativa = dados.automacao_ativa
    if dados.tamanho_atual is not None:
        grupo.tamanho_atual = dados.tamanho_atual
    if dados.crescimento_semanal is not None:
        grupo.crescimento_semanal = dados.crescimento_semanal

    grupo.data_atualizacao = datetime.utcnow()
    db.commit()

    return {"mensagem": "Grupo atualizado com sucesso"}


@app.delete("/grupos/{grupo_id}")
def deletar_grupo(grupo_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Deleta um grupo"""
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id,
                                   Grupo.criado_por_id == usuario.id).first()

    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    db.delete(grupo)
    db.commit()

    return {"mensagem": "Grupo excluído com sucesso"}


@app.post("/grupos/{grupo_id}/duplicar")
def duplicar_grupo(grupo_id: int,
                   usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Duplica um grupo existente"""
    grupo_original = db.query(Grupo).filter(
        Grupo.id == grupo_id, Grupo.criado_por_id == usuario.id).first()

    if not grupo_original:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    novo_grupo = Grupo(
        nome=f"{grupo_original.nome} (Cópia)",
        descricao=grupo_original.descricao,
        status="inativo",  # Inicia inativo para configuração
        criterios=grupo_original.criterios,
        cor=grupo_original.cor,
        tipo_grupo=grupo_original.tipo_grupo,
        unidade_id=grupo_original.unidade_id,
        criado_por_id=usuario.id)

    db.add(novo_grupo)
    db.commit()
    db.refresh(novo_grupo)

    return {"id": novo_grupo.id, "mensagem": "Grupo duplicado com sucesso"}


@app.get("/grupos/{grupo_id}/membros")
def obter_membros_grupo(grupo_id: int,
                        usuario: Usuario = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    """Obtém lista de membros de um grupo baseado nos critérios"""
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id,
                                   Grupo.criado_por_id == usuario.id).first()

    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    # Filtro básico: usuários da mesma unidade
    membros_query = db.query(Usuario).filter(
        Usuario.unidade_id == grupo.unidade_id, Usuario.ativo == True)

    # TODO: Aplicar critérios dinâmicos do grupo quando implementado
    # Por enquanto, retorna todos os usuários ativos da unidade

    membros = membros_query.all()

    resultado = []
    for membro in membros:
        resultado.append({
            "id": membro.id,
            "nome": membro.nome,
            "email": membro.email,
            "tipo": membro.tipo,
            "data_cadastro": membro.data_cadastro.isoformat()
        })

    return {"total": len(resultado), "membros": resultado}


@app.get("/grupos/sugestoes-ia")
def obter_sugestoes_ia(usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Retorna sugestões de grupos inteligentes criados pela IA (mock)"""

    # Mock de sugestões inteligentes baseadas em padrões
    sugestoes = [{
        "nome": "Alto Risco de Abandono",
        "descricao":
        "Usuários com baixa frequência nas últimas 3 semanas e sem abertura do app",
        "tipo_grupo": "ia_sugestao",
        "cor": "#e74c3c",
        "criterios": {
            "comportamento": {
                "frequencia_semanal": {
                    "operador": "<",
                    "valor": 2
                },
                "dias_sem_treino": {
                    "operador": ">",
                    "valor": 14
                },
                "abertura_app": {
                    "operador": "=",
                    "valor": 0
                }
            }
        },
        "estimativa_membros": 23,
        "impacto_previsto": "alto"
    }, {
        "nome": "Alta Performance",
        "descricao":
        "Usuários com mais de 4 treinos semanais e engajamento consistente",
        "tipo_grupo": "ia_sugestao",
        "cor": "#27ae60",
        "criterios": {
            "comportamento": {
                "frequencia_semanal": {
                    "operador": ">=",
                    "valor": 4
                },
                "conclusao_treino": {
                    "operador": ">",
                    "valor": 90
                }
            }
        },
        "estimativa_membros": 47,
        "impacto_previsto": "médio"
    }, {
        "nome": "Baixa Frequência - Recuperável",
        "descricao":
        "Usuários com treino irregular mas que ainda abrem o app regularmente",
        "tipo_grupo": "ia_sugestao",
        "cor": "#f39c12",
        "criterios": {
            "comportamento": {
                "frequencia_semanal": {
                    "operador": "<",
                    "valor": 2
                },
                "abertura_app": {
                    "operador": ">",
                    "valor": 3
                },
                "leitura_mensagens": {
                    "operador": ">",
                    "valor": 50
                }
            }
        },
        "estimativa_membros": 34,
        "impacto_previsto": "alto"
    }, {
        "nome": "Iniciantes Promissores",
        "descricao":
        "Novos usuários com menos de 30 dias e frequência crescente",
        "tipo_grupo": "ia_sugestao",
        "cor": "#3498db",
        "criterios": {
            "perfil": {
                "dias_cadastrado": {
                    "operador": "<=",
                    "valor": 30
                },
                "tendencia_frequencia": {
                    "operador": "=",
                    "valor": "crescente"
                }
            }
        },
        "estimativa_membros": 18,
        "impacto_previsto": "médio"
    }, {
        "nome": "Stress Elevado",
        "descricao":
        "Usuários que reportaram baixo humor e alta carga de trabalho nos questionários",
        "tipo_grupo": "ia_sugestao",
        "cor": "#9b59b6",
        "criterios": {
            "questionarios": {
                "humor": {
                    "operador": "<=",
                    "valor": 3
                },
                "stress": {
                    "operador": ">=",
                    "valor": 7
                }
            }
        },
        "estimativa_membros": 29,
        "impacto_previsto": "alto"
    }]

    return sugestoes
