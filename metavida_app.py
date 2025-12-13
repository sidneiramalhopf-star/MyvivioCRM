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
import pandas as pd
from sklearn.linear_model import LogisticRegression
import pickle
import json

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
    telefone = Column(String, nullable=True)
    tipo_unidade = Column(String, default="B2C")
    risco_desistencia = Column(Float, default=0.0)
    modelo_churn = Column(Text, nullable=True)
    usuarios = relationship("Usuario", back_populates="unidade")
    programas = relationship("Programa", back_populates="unidade")
    contratos = relationship("Contrato", back_populates="unidade")


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
    risco_churn = Column(Float, default=0.0)
    unidade = relationship("Unidade", back_populates="usuarios")
    agendas = relationship("Agenda", back_populates="usuario")
    jornadas = relationship("UsuarioJornada", back_populates="usuario")


class Visitante(Base):
    __tablename__ = "visitantes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String)
    telefone = Column(String)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    data_visita = Column(DateTime, default=datetime.utcnow)
    convertido = Column(Boolean, default=False)
    lead_score = Column(Integer, default=0)
    tipo_lead = Column(String, default="Individual")
    empresa = Column(String, nullable=True)
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


class Contrato(Base):
    __tablename__ = "contratos"
    id = Column(Integer, primary_key=True, index=True)
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    nome = Column(String, nullable=False)
    data_inicio = Column(DateTime)
    data_fim = Column(DateTime)
    valor_mensal = Column(Float)
    limite_usuarios = Column(Integer, nullable=True)
    status = Column(String, default="ativo")
    unidade = relationship("Unidade", back_populates="contratos")


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
# Modelo de Eventos - Sistema Event-Driven para Automações
# ============================================================


class EventoSistema(Base):
    __tablename__ = "eventos_sistema"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # RESERVA_CRIADA, CHURN_ALERTA, LEAD_CONVERTIDO, etc
    payload = Column(Text, nullable=True)  # JSON com dados do evento
    data_registro = Column(DateTime, default=datetime.utcnow)
    processado = Column(Boolean, default=False)
    data_processamento = Column(DateTime, nullable=True)


# ============================================================
# Modelos de Automação - Sistema de Jornadas e Workflows
# ============================================================


class Jornada(Base):
    __tablename__ = "jornadas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    gatilho_evento = Column(String, nullable=False)  # Ex: USUARIO_CRIADO, RESERVA_CRIADA, CHURN_ALERTA
    ativa = Column(Boolean, default=True)
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=True)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    etapas = relationship("EtapaJornada", back_populates="jornada", order_by="EtapaJornada.ordem", cascade="all, delete-orphan")
    unidade = relationship("Unidade")
    criado_por = relationship("Usuario")


class EtapaJornada(Base):
    __tablename__ = "etapas_jornada"
    id = Column(Integer, primary_key=True, index=True)
    jornada_id = Column(Integer, ForeignKey("jornadas.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String, nullable=False)
    ordem = Column(Integer, nullable=False)
    acao_tipo = Column(String, nullable=False)  # ENVIAR_EMAIL, CRIAR_TAREFA, MUDAR_STATUS, CRIAR_GRUPO, etc
    acao_config = Column(Text, nullable=False)  # JSON com detalhes da ação
    
    jornada = relationship("Jornada", back_populates="etapas")


class UsuarioJornada(Base):
    __tablename__ = "usuarios_jornadas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    jornada_id = Column(Integer, ForeignKey("jornadas.id"), nullable=False)
    etapa_atual_id = Column(Integer, ForeignKey("etapas_jornada.id"), nullable=True)
    data_inicio = Column(DateTime, default=datetime.utcnow)
    data_conclusao = Column(DateTime, nullable=True)
    concluida = Column(Boolean, default=False)
    
    usuario = relationship("Usuario", back_populates="jornadas")
    jornada = relationship("Jornada")
    etapa_atual = relationship("EtapaJornada")


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


def migrar_schema_b2b_startup():
    """
    Migração automática para suporte B2B - executada no startup
    """
    import sqlite3
    
    conn = sqlite3.connect("gym_wellness.db")
    cursor = conn.cursor()
    
    def column_exists(table_name, column_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col[1] for col in cursor.fetchall()]
        return column_name in columns
    
    try:
        if not column_exists('unidades', 'tipo_unidade'):
            cursor.execute("ALTER TABLE unidades ADD COLUMN tipo_unidade VARCHAR DEFAULT 'B2C'")
            print("✅ Migração B2B: Coluna 'tipo_unidade' adicionada")
        
        if not column_exists('visitantes', 'tipo_lead'):
            cursor.execute("ALTER TABLE visitantes ADD COLUMN tipo_lead VARCHAR DEFAULT 'Individual'")
            print("✅ Migração B2B: Coluna 'tipo_lead' adicionada")
        
        if not column_exists('visitantes', 'empresa'):
            cursor.execute("ALTER TABLE visitantes ADD COLUMN empresa VARCHAR")
            print("✅ Migração B2B: Coluna 'empresa' adicionada")
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"⚠️ Erro durante migração B2B (pode já estar aplicada): {e}")
    finally:
        conn.close()


def init_sample_data():
    db = SessionLocal()
    try:
        # Passo 1: MIGRAÇÃO B2B AUTOMÁTICA
        migrar_schema_b2b_startup()
        
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


def get_admin_user(current_user: Usuario = Depends(get_current_user)):
    """Verifica se o usuário atual é administrador"""
    if current_user.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Requer privilégios de administrador.")
    return current_user


# ============================================================
# Funções de Machine Learning - Previsão de Churn
# ============================================================


def treinar_modelo_churn(db: Session, unidade_id: int):
    """Treina modelo de Regressão Logística para prever risco de churn"""
    usuarios = db.query(Usuario).filter(Usuario.unidade_id == unidade_id).all()
    
    if len(usuarios) < 10:
        return {"sucesso": False, "mensagem": "Dados insuficientes para treinamento (mínimo 10 usuários)"}
    
    data = []
    for u in usuarios:
        dias_inatividade = (datetime.utcnow() - u.ultima_atividade).days
        
        reservas_canceladas = db.query(ReservaAula).filter(
            ReservaAula.usuario_id == u.id,
            ReservaAula.cancelada == True
        ).count()
        
        total_reservas = db.query(ReservaAula).filter(
            ReservaAula.usuario_id == u.id
        ).count()
        
        taxa_cancelamento = (reservas_canceladas / total_reservas * 100) if total_reservas > 0 else 0
        
        churn = 1 if dias_inatividade > 60 and taxa_cancelamento > 40 else 0
        
        data.append({
            'dias_inatividade': dias_inatividade,
            'taxa_cancelamento': taxa_cancelamento,
            'churn': churn
        })
    
    df = pd.DataFrame(data)
    X = df[['dias_inatividade', 'taxa_cancelamento']]
    y = df['churn']
    
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    
    modelo_serializado = pickle.dumps(model)
    unidade = db.query(Unidade).get(unidade_id)
    unidade.modelo_churn = modelo_serializado.hex()
    db.commit()
    
    return {"sucesso": True, "mensagem": f"Modelo treinado com {len(usuarios)} usuários"}


def prever_risco_churn(db: Session, usuario: Usuario):
    """Usa modelo treinado para prever risco de churn do usuário"""
    unidade = db.query(Unidade).get(usuario.unidade_id)
    if not unidade or not unidade.modelo_churn:
        return 0.0
    
    try:
        model = pickle.loads(bytes.fromhex(unidade.modelo_churn))
    except:
        return 0.0
    
    dias_inatividade = (datetime.utcnow() - usuario.ultima_atividade).days
    
    reservas_canceladas = db.query(ReservaAula).filter(
        ReservaAula.usuario_id == usuario.id,
        ReservaAula.cancelada == True
    ).count()
    
    total_reservas = db.query(ReservaAula).filter(
        ReservaAula.usuario_id == usuario.id
    ).count()
    
    taxa_cancelamento = (reservas_canceladas / total_reservas * 100) if total_reservas > 0 else 0
    
    risco = model.predict_proba([[dias_inatividade, taxa_cancelamento]])[0][1]
    
    usuario.risco_churn = round(risco, 4)
    db.commit()
    
    if risco > 0.75:
        registrar_evento(db, "CHURN_ALERTA", {
            "usuario_id": usuario.id,
            "usuario_nome": usuario.nome,
            "risco": round(risco * 100, 2)
        })
    
    return risco


# ============================================================
# Funções de Sistema de Eventos (Event-Driven)
# ============================================================


def registrar_evento(db: Session, tipo: str, payload: dict):
    """Registra um evento no sistema para processamento assíncrono"""
    evento = EventoSistema(
        tipo=tipo,
        payload=json.dumps(payload)
    )
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento


async def processar_eventos(db: Session):
    """Processa eventos pendentes (automações, notificações, etc)"""
    eventos = db.query(EventoSistema).filter(EventoSistema.processado == False).limit(50).all()
    
    for evento in eventos:
        try:
            payload = json.loads(evento.payload)
            
            if evento.tipo == "CHURN_ALERTA":
                print(f"[ALERTA CHURN] Usuário {payload.get('usuario_nome')} com risco de {payload.get('risco')}%")
                
                grupo_alto_risco = db.query(Grupo).filter(
                    Grupo.nome == "Alto Risco de Churn",
                    Grupo.tipo_grupo == "dinamico"
                ).first()
                
                if not grupo_alto_risco:
                    grupo_alto_risco = Grupo(
                        nome="Alto Risco de Churn",
                        descricao="Usuários com alta probabilidade de desistência (criado automaticamente por IA)",
                        status="ativo",
                        tipo_grupo="dinamico",
                        cor="#e74c3c",
                        automacao_ativa=True,
                        criterios=json.dumps({"risco_churn": {"operador": ">", "valor": 0.75}})
                    )
                    db.add(grupo_alto_risco)
                    db.commit()
                    print(f"[GRUPO CRIADO] Grupo 'Alto Risco de Churn' criado automaticamente")
            
            elif evento.tipo == "RESERVA_CRIADA":
                print(f"[RESERVA] Nova reserva criada por usuário ID {payload.get('usuario_id')}")
            
            elif evento.tipo == "LEAD_CONVERTIDO":
                print(f"[LEAD] Visitante convertido: {payload.get('nome')}")
            
            # Processar jornadas acionadas por este evento
            await processar_jornadas_por_evento(db, evento)
            
            evento.processado = True
            evento.data_processamento = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            print(f"[ERRO] Falha ao processar evento {evento.id}: {e}")
            db.rollback()


# ============================================================
# Funções de Automação - Sistema de Jornadas
# ============================================================


async def executar_acao_workflow(db: Session, usuario: Usuario, etapa: EtapaJornada):
    """Executa a ação definida na etapa do workflow"""
    try:
        config = json.loads(etapa.acao_config)
        
        if etapa.acao_tipo == "ENVIAR_EMAIL":
            assunto = config.get("assunto", "Notificação VIVIO CRM")
            corpo = config.get("corpo", "Mensagem automática.")
            
            # Personalização básica
            corpo = corpo.replace("{usuario_nome}", usuario.nome).replace("{usuario_email}", usuario.email)
            
            await enviar_email(usuario.email, assunto, corpo)
            print(f"[WORKFLOW] E-mail '{assunto}' enviado para {usuario.email}")
            return True
            
        elif etapa.acao_tipo == "CRIAR_TAREFA":
            titulo = config.get("titulo", "Tarefa de Acompanhamento")
            descricao = config.get("descricao", f"Acompanhar usuário {usuario.nome} na jornada.")
            
            tarefa = Agenda(
                usuario_id=usuario.id,
                titulo=titulo,
                descricao=descricao,
                tipo_atividade="tarefa_automatica",
                concluida=False
            )
            db.add(tarefa)
            db.commit()
            print(f"[WORKFLOW] Tarefa '{titulo}' criada para {usuario.nome}")
            return True
            
        elif etapa.acao_tipo == "MUDAR_STATUS":
            novo_status = config.get("status")
            if novo_status == "inativo":
                usuario.ativo = False
            elif novo_status == "ativo":
                usuario.ativo = True
            db.commit()
            print(f"[WORKFLOW] Status do usuário {usuario.nome} alterado para {novo_status}")
            return True
            
        elif etapa.acao_tipo == "CRIAR_GRUPO":
            nome_grupo = config.get("nome_grupo", "Grupo Automático")
            descricao = config.get("descricao", "Grupo criado automaticamente por jornada")
            
            grupo = db.query(Grupo).filter(Grupo.nome == nome_grupo).first()
            if not grupo:
                grupo = Grupo(
                    nome=nome_grupo,
                    descricao=descricao,
                    status="ativo",
                    tipo_grupo="jornada_automatica",
                    cor=config.get("cor", "#62b1ca"),
                    unidade_id=usuario.unidade_id
                )
                db.add(grupo)
                db.commit()
            print(f"[WORKFLOW] Grupo '{nome_grupo}' criado/verificado")
            return True
            
        elif etapa.acao_tipo == "ADICIONAR_AO_GRUPO":
            grupo_id = config.get("grupo_id")
            if grupo_id:
                # Lógica de adicionar usuário ao grupo (implementar se necessário)
                print(f"[WORKFLOW] Usuário {usuario.nome} adicionado ao grupo {grupo_id}")
                return True
                
    except Exception as e:
        print(f"[ERRO] Falha ao executar ação {etapa.acao_tipo}: {e}")
        return False
    
    return False


async def avancar_jornada(db: Session, usuario_jornada: UsuarioJornada):
    """Avança o usuário para a próxima etapa da jornada"""
    jornada = usuario_jornada.jornada
    etapas = sorted(jornada.etapas, key=lambda e: e.ordem)
    
    if not etapas:
        usuario_jornada.concluida = True
        usuario_jornada.data_conclusao = datetime.utcnow()
        db.commit()
        print(f"[JORNADA] Jornada '{jornada.nome}' concluída (sem etapas)")
        return
        
    etapa_atual = usuario_jornada.etapa_atual
    
    if etapa_atual is None:
        # Primeira execução - iniciar na primeira etapa
        proxima_etapa = etapas[0]
    else:
        # Encontrar próxima etapa
        etapa_index = next((i for i, e in enumerate(etapas) if e.id == etapa_atual.id), -1)
        if etapa_index == -1 or etapa_index == len(etapas) - 1:
            # Última etapa concluída
            usuario_jornada.concluida = True
            usuario_jornada.data_conclusao = datetime.utcnow()
            db.commit()
            print(f"[JORNADA] Jornada '{jornada.nome}' concluída para usuário {usuario_jornada.usuario.nome}")
            return
        proxima_etapa = etapas[etapa_index + 1]
        
    # Executar ação da próxima etapa
    sucesso = await executar_acao_workflow(db, usuario_jornada.usuario, proxima_etapa)
    
    if sucesso:
        usuario_jornada.etapa_atual_id = proxima_etapa.id
        db.commit()
        print(f"[JORNADA] Etapa '{proxima_etapa.nome}' executada para usuário {usuario_jornada.usuario.nome}")


async def iniciar_jornada(db: Session, usuario: Usuario, jornada: Jornada):
    """Inicia uma nova jornada para um usuário"""
    # Verificar se usuário já está nessa jornada
    jornada_existente = db.query(UsuarioJornada).filter(
        UsuarioJornada.usuario_id == usuario.id,
        UsuarioJornada.jornada_id == jornada.id,
        UsuarioJornada.concluida == False
    ).first()
    
    if jornada_existente:
        print(f"[JORNADA] Usuário {usuario.nome} já está na jornada '{jornada.nome}'")
        return
    
    usuario_jornada = UsuarioJornada(
        usuario_id=usuario.id,
        jornada_id=jornada.id,
        etapa_atual_id=None,
        concluida=False
    )
    db.add(usuario_jornada)
    db.commit()
    db.refresh(usuario_jornada)
    
    print(f"[JORNADA] Jornada '{jornada.nome}' iniciada para usuário {usuario.nome}")
    
    # Executar primeira etapa
    await avancar_jornada(db, usuario_jornada)


async def processar_jornadas_por_evento(db: Session, evento: EventoSistema):
    """Processa jornadas que são acionadas por um evento específico"""
    try:
        payload = json.loads(evento.payload)
        usuario_id = payload.get("usuario_id")
        
        if not usuario_id:
            return
            
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            return
        
        # Encontrar jornadas ativas que são acionadas por este evento
        jornadas_ativas = db.query(Jornada).filter(
            Jornada.gatilho_evento == evento.tipo,
            Jornada.ativa == True
        ).all()
        
        # Filtrar por unidade se usuário tiver unidade
        if usuario.unidade_id:
            jornadas_ativas = [j for j in jornadas_ativas if j.unidade_id is None or j.unidade_id == usuario.unidade_id]
        
        for jornada in jornadas_ativas:
            await iniciar_jornada(db, usuario, jornada)
            
        # Avançar jornadas em andamento (se aplicável)
        jornadas_em_andamento = db.query(UsuarioJornada).filter(
            UsuarioJornada.usuario_id == usuario_id,
            UsuarioJornada.concluida == False
        ).all()
        
        for uj in jornadas_em_andamento:
            # Apenas avança se houver lógica específica (por enquanto, skip)
            pass
            
    except Exception as e:
        print(f"[ERRO] Falha ao processar jornadas do evento {evento.id}: {e}")


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

from pydantic import BaseModel, Field


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
    db.refresh(usuario)
    
    # Registrar evento para acionar jornadas de onboarding
    registrar_evento(db, "USUARIO_CRIADO", {
        "usuario_id": usuario.id,
        "usuario_nome": usuario.nome,
        "usuario_email": usuario.email,
        "unidade_id": usuario.unidade_id
    })
    
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


@app.get("/me")
def get_me(usuario: Usuario = Depends(get_current_user)):
    """Retorna informações do usuário logado"""
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "tipo": usuario.tipo,
        "unidade_id": usuario.unidade_id,
        "ativo": usuario.ativo
    }


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
    result = []
    for p in programas:
        prog_data = {
            "id": p.id,
            "nome": p.nome,
            "status": p.status,
            "usuarios_matriculados": p.usuarios_matriculados,
            "data_inicio": p.data_inicio.isoformat() if p.data_inicio else None,
            "data_fim": p.data_fim.isoformat() if p.data_fim else None
        }
        # Parse descricao if it contains JSON with sessions
        try:
            desc_data = json.loads(p.descricao) if p.descricao else {}
            if isinstance(desc_data, dict) and "sessoes" in desc_data:
                prog_data["descricao"] = desc_data.get("texto", "")
                prog_data["sessoes"] = desc_data.get("sessoes", [])
            else:
                prog_data["descricao"] = p.descricao or ""
                prog_data["sessoes"] = []
        except (json.JSONDecodeError, TypeError):
            prog_data["descricao"] = p.descricao or ""
            prog_data["sessoes"] = []
        result.append(prog_data)
    return result


@app.post("/programas/criar")
async def criar_programa(request: Request,
                   usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    data = await request.json()
    nome = data.get("nome", "Programa sem nome")
    descricao = data.get("descricao", "")
    status = data.get("status", "ativo")
    unidade_id = data.get("unidade_id", usuario.unidade_id or 1)
    sessoes = data.get("sessoes", [])
    
    # Store sessions as JSON in descricao if provided
    if sessoes:
        descricao_json = json.dumps({
            "texto": descricao,
            "sessoes": sessoes
        })
    else:
        descricao_json = descricao
    
    programa = Programa(nome=nome,
                        descricao=descricao_json,
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


@app.get("/visitantes")
def listar_visitantes(usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    visitantes = db.query(Visitante).all()
    return [{
        "id": v.id,
        "nome": v.nome,
        "email": v.email,
        "telefone": v.telefone,
        "unidade_id": v.unidade_id,
        "data_visita": v.data_visita.isoformat() if v.data_visita else None,
        "convertido": v.convertido,
        "lead_score": v.lead_score,
        "tipo_lead": v.tipo_lead,
        "empresa": v.empresa
    } for v in visitantes]


@app.get("/visitantes/{visitante_id}")
def obter_visitante(visitante_id: int,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    visitante = db.query(Visitante).filter(Visitante.id == visitante_id).first()
    if not visitante:
        raise HTTPException(status_code=404, detail="Visitante não encontrado")
    return {
        "id": visitante.id,
        "nome": visitante.nome,
        "email": visitante.email,
        "telefone": visitante.telefone,
        "unidade_id": visitante.unidade_id,
        "data_visita": visitante.data_visita.isoformat() if visitante.data_visita else None,
        "convertido": visitante.convertido,
        "lead_score": visitante.lead_score,
        "tipo_lead": visitante.tipo_lead,
        "empresa": visitante.empresa
    }


@app.post("/visitantes")
def criar_visitante(nome: str,
                    email: str,
                    telefone: str = "",
                    unidade_id: int = 1,
                    tipo_lead: str = "Individual",
                    empresa: str = None,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    visitante = Visitante(
        nome=nome,
        email=email,
        telefone=telefone,
        unidade_id=unidade_id,
        tipo_lead=tipo_lead,
        empresa=empresa
    )
    db.add(visitante)
    db.commit()
    db.refresh(visitante)
    return {
        "mensagem": "Visitante criado com sucesso!",
        "id": visitante.id,
        "visitante": {
            "id": visitante.id,
            "nome": visitante.nome,
            "email": visitante.email,
            "telefone": visitante.telefone,
            "tipo_lead": visitante.tipo_lead,
            "empresa": visitante.empresa
        }
    }


@app.put("/visitantes/{visitante_id}")
def atualizar_visitante(visitante_id: int,
                        nome: str = None,
                        email: str = None,
                        telefone: str = None,
                        convertido: bool = None,
                        lead_score: int = None,
                        tipo_lead: str = None,
                        empresa: str = None,
                        usuario: Usuario = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    visitante = db.query(Visitante).filter(Visitante.id == visitante_id).first()
    if not visitante:
        raise HTTPException(status_code=404, detail="Visitante não encontrado")
    
    if nome is not None:
        visitante.nome = nome
    if email is not None:
        visitante.email = email
    if telefone is not None:
        visitante.telefone = telefone
    if convertido is not None:
        visitante.convertido = convertido
    if lead_score is not None:
        visitante.lead_score = lead_score
    if tipo_lead is not None:
        visitante.tipo_lead = tipo_lead
    if empresa is not None:
        visitante.empresa = empresa
    
    db.commit()
    return {"mensagem": "Visitante atualizado com sucesso!"}


@app.delete("/visitantes/{visitante_id}")
def deletar_visitante(visitante_id: int,
                      usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    visitante = db.query(Visitante).filter(Visitante.id == visitante_id).first()
    if not visitante:
        raise HTTPException(status_code=404, detail="Visitante não encontrado")
    
    db.delete(visitante)
    db.commit()
    return {"mensagem": "Visitante deletado com sucesso!"}


# ============================================================
# Endpoints de Usuários (Contatos/Membros)
# ============================================================


@app.get("/usuarios")
def listar_usuarios(usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).all()
    return [{
        "id": u.id,
        "nome": u.nome,
        "email": u.email,
        "tipo": u.tipo,
        "unidade_id": u.unidade_id,
        "ativo": u.ativo,
        "data_cadastro": u.data_cadastro.isoformat() if u.data_cadastro else None,
        "ultima_atividade": u.ultima_atividade.isoformat() if u.ultima_atividade else None,
        "risco_churn": u.risco_churn
    } for u in usuarios]


@app.get("/usuarios/{usuario_id}")
def obter_usuario(usuario_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "tipo": user.tipo,
        "unidade_id": user.unidade_id,
        "ativo": user.ativo,
        "data_cadastro": user.data_cadastro.isoformat() if user.data_cadastro else None,
        "ultima_atividade": user.ultima_atividade.isoformat() if user.ultima_atividade else None,
        "risco_churn": user.risco_churn
    }


@app.post("/usuarios")
def criar_usuario(nome: str,
                  email: str,
                  senha: str,
                  tipo: str = "aluno",
                  unidade_id: int = 1,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    existing = db.query(Usuario).filter(Usuario.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    novo_usuario = Usuario(
        nome=nome,
        email=email,
        senha=pwd_context.hash(senha),
        tipo=tipo,
        unidade_id=unidade_id
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return {
        "mensagem": "Usuário criado com sucesso!",
        "id": novo_usuario.id,
        "usuario": {
            "id": novo_usuario.id,
            "nome": novo_usuario.nome,
            "email": novo_usuario.email,
            "tipo": novo_usuario.tipo
        }
    }


@app.put("/usuarios/{usuario_id}")
def atualizar_usuario(usuario_id: int,
                      nome: str = None,
                      email: str = None,
                      tipo: str = None,
                      ativo: bool = None,
                      risco_churn: float = None,
                      usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if nome is not None:
        user.nome = nome
    if email is not None:
        existing = db.query(Usuario).filter(Usuario.email == email, Usuario.id != usuario_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        user.email = email
    if tipo is not None:
        user.tipo = tipo
    if ativo is not None:
        user.ativo = ativo
    if risco_churn is not None:
        user.risco_churn = risco_churn
    
    user.ultima_atividade = datetime.utcnow()
    db.commit()
    return {"mensagem": "Usuário atualizado com sucesso!"}


@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.id == usuario.id:
        raise HTTPException(status_code=400, detail="Não é possível deletar seu próprio usuário")
    
    db.delete(user)
    db.commit()
    return {"mensagem": "Usuário deletado com sucesso!"}


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


@app.put("/calendario/eventos/{evento_id}")
def atualizar_evento_calendario(evento_id: int,
                                titulo: str = None,
                                descricao: str = None,
                                data_inicio: str = None,
                                data_fim: str = None,
                                tipo_evento: str = None,
                                lembrete: bool = None,
                                cor: str = None,
                                usuario: Usuario = Depends(get_current_user),
                                db: Session = Depends(get_db)):
    evento = db.query(EventoCalendario).filter(
        EventoCalendario.id == evento_id,
        EventoCalendario.usuario_id == usuario.id).first()

    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    if titulo is not None:
        evento.titulo = titulo
    if descricao is not None:
        evento.descricao = descricao
    if data_inicio is not None:
        evento.data_inicio = datetime.fromisoformat(data_inicio)
    if data_fim is not None:
        evento.data_fim = datetime.fromisoformat(data_fim)
    if tipo_evento is not None:
        evento.tipo_evento = tipo_evento
    if lembrete is not None:
        evento.lembrete = lembrete
    if cor is not None:
        evento.cor = cor

    db.commit()
    return {
        "mensagem": "Evento atualizado com sucesso!",
        "id": evento.id,
        "titulo": evento.titulo,
        "descricao": evento.descricao,
        "data_inicio": evento.data_inicio.isoformat() if evento.data_inicio else None,
        "data_fim": evento.data_fim.isoformat() if evento.data_fim else None,
        "tipo_evento": evento.tipo_evento,
        "status": evento.status,
        "lembrete": evento.lembrete,
        "cor": evento.cor
    }


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


@app.put("/aulas/{aula_id}")
def atualizar_aula(aula_id: int,
                   nome_aula: str = None,
                   descricao: str = None,
                   instrutor_id: int = None,
                   sala_id: int = None,
                   data_hora: str = None,
                   duracao_minutos: int = None,
                   limite_inscricoes: int = None,
                   recorrente: bool = None,
                   usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    if nome_aula is not None:
        aula.nome_aula = nome_aula
    if descricao is not None:
        aula.descricao = descricao
    if instrutor_id is not None:
        aula.instrutor_id = instrutor_id
    if sala_id is not None:
        aula.sala_id = sala_id
    if data_hora is not None:
        aula.data_hora = datetime.fromisoformat(data_hora)
    if duracao_minutos is not None:
        aula.duracao_minutos = duracao_minutos
    if limite_inscricoes is not None:
        aula.limite_inscricoes = limite_inscricoes
    if recorrente is not None:
        aula.recorrente = recorrente

    db.commit()
    return {
        "mensagem": "Aula atualizada com sucesso!",
        "id": aula.id,
        "nome_aula": aula.nome_aula,
        "instrutor": aula.instrutor.nome if aula.instrutor else None,
        "sala": aula.sala.nome if aula.sala else None,
        "data_hora": aula.data_hora.isoformat() if aula.data_hora else None
    }


@app.delete("/aulas/{aula_id}")
def deletar_aula(aula_id: int,
                 usuario: Usuario = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    aula = db.query(EventoAula).filter(EventoAula.id == aula_id).first()
    if not aula:
        raise HTTPException(status_code=404, detail="Aula não encontrada")

    aula.ativa = False
    db.commit()
    return {"mensagem": "Aula removida com sucesso!"}


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
    db.refresh(reserva)
    
    # Registrar evento para acionar jornadas
    registrar_evento(db, "RESERVA_CRIADA", {
        "usuario_id": usuario.id,
        "usuario_nome": usuario.nome,
        "aula_id": aula_id,
        "aula_nome": aula.nome_aula,
        "reserva_id": reserva.id
    })

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
# Schemas Pydantic - Contratos B2B
# ============================================================


class ContratoCreate(BaseModel):
    unidade_id: int
    nome: str
    data_inicio: datetime
    data_fim: datetime
    valor_mensal: float
    limite_usuarios: Optional[int] = None


class ContratoUpdate(BaseModel):
    nome: Optional[str] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    valor_mensal: Optional[float] = None
    limite_usuarios: Optional[int] = None
    status: Optional[str] = None


class ContratoResponse(BaseModel):
    id: int
    unidade_id: int
    nome: str
    data_inicio: datetime
    data_fim: datetime
    valor_mensal: float
    limite_usuarios: Optional[int] = None
    status: str
    
    class Config:
        from_attributes = True


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


# ============================================================
# Schemas Pydantic - Jornadas e Automação
# ============================================================


class JornadaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    gatilho_evento: str = Field(..., description="Evento que inicia a jornada (ex: USUARIO_CRIADO, CHURN_ALERTA)")
    ativa: Optional[bool] = True


class JornadaCreate(JornadaBase):
    pass


class JornadaUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    gatilho_evento: Optional[str] = None
    ativa: Optional[bool] = None


class JornadaInDB(JornadaBase):
    id: int
    unidade_id: Optional[int] = None
    criado_por_id: Optional[int] = None
    data_criacao: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True


class EtapaJornadaBase(BaseModel):
    nome: str
    ordem: int
    acao_tipo: str = Field(..., description="Tipo de ação (ex: ENVIAR_EMAIL, CRIAR_TAREFA, MUDAR_STATUS)")
    acao_config: dict = Field(..., description="Configuração JSON da ação")


class EtapaJornadaCreate(EtapaJornadaBase):
    pass


class EtapaJornadaUpdate(BaseModel):
    nome: Optional[str] = None
    ordem: Optional[int] = None
    acao_tipo: Optional[str] = None
    acao_config: Optional[dict] = None


class EtapaJornadaInDB(EtapaJornadaBase):
    id: int
    jornada_id: int
    
    class Config:
        from_attributes = True


class UsuarioJornadaInDB(BaseModel):
    id: int
    usuario_id: int
    jornada_id: int
    etapa_atual_id: Optional[int] = None
    data_inicio: datetime
    data_conclusao: Optional[datetime] = None
    concluida: bool
    
    class Config:
        from_attributes = True


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


# ============================================================
# Endpoints - Contratos B2B
# ============================================================


@app.get("/contratos")
def listar_contratos(usuario: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    """Lista todos os contratos da unidade"""
    contratos = db.query(Contrato).filter(
        Contrato.unidade_id == usuario.unidade_id).order_by(
            Contrato.data_inicio.desc()).all()
    
    return [ContratoResponse.from_orm(c) for c in contratos]


@app.post("/contratos", response_model=ContratoResponse)
def criar_contrato(dados: ContratoCreate,
                   usuario: Usuario = Depends(get_admin_user),
                   db: Session = Depends(get_db)):
    """Cria um novo contrato (admin only)"""
    contrato = Contrato(**dados.dict())
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    
    registrar_evento(db, "CONTRATO_CRIADO", {
        "contrato_id": contrato.id,
        "unidade_id": contrato.unidade_id,
        "valor_mensal": contrato.valor_mensal
    })
    
    return contrato


@app.get("/contratos/{contrato_id}", response_model=ContratoResponse)
def obter_contrato(contrato_id: int,
                   usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Obtém detalhes de um contrato específico"""
    contrato = db.query(Contrato).filter(
        Contrato.id == contrato_id,
        Contrato.unidade_id == usuario.unidade_id).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    return contrato


@app.put("/contratos/{contrato_id}", response_model=ContratoResponse)
def atualizar_contrato(contrato_id: int,
                       dados: ContratoUpdate,
                       usuario: Usuario = Depends(get_admin_user),
                       db: Session = Depends(get_db)):
    """Atualiza um contrato existente"""
    contrato = db.query(Contrato).filter(
        Contrato.id == contrato_id,
        Contrato.unidade_id == usuario.unidade_id).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    for key, value in dados.dict(exclude_unset=True).items():
        setattr(contrato, key, value)
    
    db.commit()
    db.refresh(contrato)
    
    return contrato


@app.delete("/contratos/{contrato_id}")
def deletar_contrato(contrato_id: int,
                     usuario: Usuario = Depends(get_admin_user),
                     db: Session = Depends(get_db)):
    """Deleta um contrato"""
    contrato = db.query(Contrato).filter(
        Contrato.id == contrato_id,
        Contrato.unidade_id == usuario.unidade_id).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    db.delete(contrato)
    db.commit()
    
    return {"mensagem": "Contrato deletado com sucesso"}


@app.post("/contratos/{contrato_id}/renovar", response_model=ContratoResponse)
def renovar_contrato(contrato_id: int,
                     meses: int = 12,
                     usuario: Usuario = Depends(get_admin_user),
                     db: Session = Depends(get_db)):
    """Renova um contrato existente"""
    contrato = db.query(Contrato).filter(
        Contrato.id == contrato_id,
        Contrato.unidade_id == usuario.unidade_id).first()
    
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    contrato.data_fim = contrato.data_fim + timedelta(days=30 * meses)
    contrato.status = "ativo"
    
    db.commit()
    db.refresh(contrato)
    
    registrar_evento(db, "CONTRATO_RENOVADO", {
        "contrato_id": contrato.id,
        "unidade_id": contrato.unidade_id,
        "nova_data_fim": contrato.data_fim.isoformat()
    })
    
    return contrato


@app.get("/contratos/expirados/lista")
def listar_contratos_expirados(usuario: Usuario = Depends(get_admin_user),
                                db: Session = Depends(get_db)):
    """Lista contratos que estão expirando em até 30 dias"""
    hoje = datetime.utcnow()
    limite = hoje + timedelta(days=30)
    
    contratos = db.query(Contrato).filter(
        Contrato.unidade_id == usuario.unidade_id,
        Contrato.data_fim <= limite,
        Contrato.data_fim >= hoje,
        Contrato.status == "ativo"
    ).all()
    
    resultado = []
    for c in contratos:
        dias_restantes = (c.data_fim - hoje).days
        resultado.append({
            **ContratoResponse.from_orm(c).dict(),
            "dias_restantes": dias_restantes,
            "status_alerta": "critico" if dias_restantes <= 15 else "atencao"
        })
    
    return resultado


# ============================================================
# Endpoints - Grupos
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


# ============================================================
# Endpoints de Jornadas e Automação
# ============================================================


@app.get("/automacao/jornadas", response_model=List[JornadaInDB])
def listar_jornadas(usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Lista todas as Jornadas do usuário"""
    jornadas = db.query(Jornada).filter(
        (Jornada.criado_por_id == usuario.id) | (Jornada.unidade_id == usuario.unidade_id)
    ).order_by(Jornada.data_criacao.desc()).all()
    
    return jornadas


@app.post("/automacao/jornadas", response_model=JornadaInDB)
def criar_jornada(jornada: JornadaCreate,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Cria uma nova Jornada (Workflow)"""
    db_jornada = Jornada(
        nome=jornada.nome,
        descricao=jornada.descricao,
        gatilho_evento=jornada.gatilho_evento,
        ativa=jornada.ativa,
        unidade_id=usuario.unidade_id,
        criado_por_id=usuario.id
    )
    db.add(db_jornada)
    db.commit()
    db.refresh(db_jornada)
    return db_jornada


@app.get("/automacao/jornadas/{jornada_id}", response_model=JornadaInDB)
def obter_jornada(jornada_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Obtém uma jornada específica"""
    jornada = db.query(Jornada).filter(Jornada.id == jornada_id).first()
    
    if not jornada:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")
    
    # Verificar permissão
    if jornada.criado_por_id != usuario.id and jornada.unidade_id != usuario.unidade_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return jornada


@app.put("/automacao/jornadas/{jornada_id}")
def atualizar_jornada(jornada_id: int,
                      dados: JornadaUpdate,
                      usuario: Usuario = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    """Atualiza uma jornada existente"""
    jornada = db.query(Jornada).filter(
        Jornada.id == jornada_id,
        Jornada.criado_por_id == usuario.id
    ).first()
    
    if not jornada:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")
    
    if dados.nome is not None:
        jornada.nome = dados.nome
    if dados.descricao is not None:
        jornada.descricao = dados.descricao
    if dados.gatilho_evento is not None:
        jornada.gatilho_evento = dados.gatilho_evento
    if dados.ativa is not None:
        jornada.ativa = dados.ativa
    
    jornada.data_atualizacao = datetime.utcnow()
    db.commit()
    
    return {"mensagem": "Jornada atualizada com sucesso"}


@app.delete("/automacao/jornadas/{jornada_id}")
def deletar_jornada(jornada_id: int,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Deleta uma jornada"""
    jornada = db.query(Jornada).filter(
        Jornada.id == jornada_id,
        Jornada.criado_por_id == usuario.id
    ).first()
    
    if not jornada:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")
    
    db.delete(jornada)
    db.commit()
    
    return {"mensagem": "Jornada excluída com sucesso"}


@app.get("/automacao/jornadas/{jornada_id}/etapas", response_model=List[EtapaJornadaInDB])
def listar_etapas_jornada(jornada_id: int,
                          usuario: Usuario = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    """Lista todas as etapas de uma Jornada"""
    jornada = db.query(Jornada).filter(Jornada.id == jornada_id).first()
    
    if not jornada:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")
    
    return db.query(EtapaJornada).filter(
        EtapaJornada.jornada_id == jornada_id
    ).order_by(EtapaJornada.ordem).all()


@app.post("/automacao/jornadas/{jornada_id}/etapas", response_model=EtapaJornadaInDB)
def adicionar_etapa_jornada(jornada_id: int,
                            etapa: EtapaJornadaCreate,
                            usuario: Usuario = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """Adiciona uma etapa (ação) a uma Jornada"""
    db_jornada = db.query(Jornada).filter(
        Jornada.id == jornada_id,
        Jornada.criado_por_id == usuario.id
    ).first()
    
    if not db_jornada:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")
    
    db_etapa = EtapaJornada(
        jornada_id=jornada_id,
        nome=etapa.nome,
        ordem=etapa.ordem,
        acao_tipo=etapa.acao_tipo,
        acao_config=json.dumps(etapa.acao_config)
    )
    db.add(db_etapa)
    db.commit()
    db.refresh(db_etapa)
    return db_etapa


@app.put("/automacao/etapas/{etapa_id}")
def atualizar_etapa(etapa_id: int,
                    dados: EtapaJornadaUpdate,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Atualiza uma etapa existente"""
    etapa = db.query(EtapaJornada).filter(EtapaJornada.id == etapa_id).first()
    
    if not etapa:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")
    
    # Verificar se usuário tem permissão
    jornada = db.query(Jornada).filter(
        Jornada.id == etapa.jornada_id,
        Jornada.criado_por_id == usuario.id
    ).first()
    
    if not jornada:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if dados.nome is not None:
        etapa.nome = dados.nome
    if dados.ordem is not None:
        etapa.ordem = dados.ordem
    if dados.acao_tipo is not None:
        etapa.acao_tipo = dados.acao_tipo
    if dados.acao_config is not None:
        etapa.acao_config = json.dumps(dados.acao_config)
    
    db.commit()
    
    return {"mensagem": "Etapa atualizada com sucesso"}


@app.delete("/automacao/etapas/{etapa_id}")
def deletar_etapa(etapa_id: int,
                  usuario: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Deleta uma etapa"""
    etapa = db.query(EtapaJornada).filter(EtapaJornada.id == etapa_id).first()
    
    if not etapa:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")
    
    # Verificar se usuário tem permissão
    jornada = db.query(Jornada).filter(
        Jornada.id == etapa.jornada_id,
        Jornada.criado_por_id == usuario.id
    ).first()
    
    if not jornada:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    db.delete(etapa)
    db.commit()
    
    return {"mensagem": "Etapa excluída com sucesso"}


@app.get("/automacao/jornadas/{jornada_id}/progresso")
def obter_progresso_jornada(jornada_id: int,
                            usuario: Usuario = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """Obtém o progresso de uma jornada (quantos usuários em cada etapa)"""
    jornada = db.query(Jornada).filter(Jornada.id == jornada_id).first()
    
    if not jornada:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")
    
    # Buscar todas as instâncias dessa jornada
    usuarios_jornada = db.query(UsuarioJornada).filter(
        UsuarioJornada.jornada_id == jornada_id
    ).all()
    
    # Contar usuários por etapa
    etapas = {etapa.id: {"nome": etapa.nome, "ordem": etapa.ordem, "usuarios": 0} for etapa in jornada.etapas}
    concluidos = 0
    em_andamento = 0
    
    for uj in usuarios_jornada:
        if uj.concluida:
            concluidos += 1
        else:
            em_andamento += 1
            if uj.etapa_atual_id and uj.etapa_atual_id in etapas:
                etapas[uj.etapa_atual_id]["usuarios"] += 1
    
    return {
        "jornada_id": jornada_id,
        "nome": jornada.nome,
        "total_usuarios": len(usuarios_jornada),
        "em_andamento": em_andamento,
        "concluidos": concluidos,
        "etapas": list(etapas.values())
    }


@app.post("/automacao/processar")
async def run_automacao(usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Endpoint para processar eventos e avançar jornadas manualmente"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    await processar_eventos(db)
    return {"mensagem": "Processamento de automação e jornadas concluído"}


# ============================================================
# Endpoints de IA e Machine Learning
# ============================================================


@app.post("/admin/ia/treinar_churn/{unidade_id}")
def endpoint_treinar_churn(unidade_id: int,
                           usuario: Usuario = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    """Treina modelo de ML para previsão de churn na unidade"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    resultado = treinar_modelo_churn(db, unidade_id)
    return resultado


@app.get("/admin/ia/riscos_churn")
def endpoint_listar_riscos_churn(usuario: Usuario = Depends(get_current_user),
                                  db: Session = Depends(get_db)):
    """Lista todos os usuários com seus riscos de churn calculados"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    usuarios = db.query(Usuario).filter(Usuario.unidade_id == usuario.unidade_id).all()
    
    riscos = []
    for u in usuarios:
        risco = prever_risco_churn(db, u)
        riscos.append({
            "id": u.id,
            "nome": u.nome,
            "email": u.email,
            "risco_churn": round(risco * 100, 2),
            "nivel": "ALTO" if risco > 0.75 else "MÉDIO" if risco > 0.40 else "BAIXO",
            "ultima_atividade": u.ultima_atividade.isoformat() if u.ultima_atividade else None
        })
    
    riscos.sort(key=lambda x: x['risco_churn'], reverse=True)
    
    return {
        "total": len(riscos),
        "alto_risco": len([r for r in riscos if r['nivel'] == 'ALTO']),
        "medio_risco": len([r for r in riscos if r['nivel'] == 'MÉDIO']),
        "baixo_risco": len([r for r in riscos if r['nivel'] == 'BAIXO']),
        "usuarios": riscos
    }


@app.get("/usuarios/{usuario_id}/risco_churn")
def endpoint_risco_churn_usuario(usuario_id: int,
                                  usuario: Usuario = Depends(get_current_user),
                                  db: Session = Depends(get_db)):
    """Calcula e retorna risco de churn de um usuário específico"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    usuario_alvo = db.query(Usuario).get(usuario_id)
    if not usuario_alvo:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    risco = prever_risco_churn(db, usuario_alvo)
    
    return {
        "usuario_id": usuario_id,
        "nome": usuario_alvo.nome,
        "risco_churn": round(risco * 100, 2),
        "nivel": "ALTO" if risco > 0.75 else "MÉDIO" if risco > 0.40 else "BAIXO"
    }


@app.post("/admin/eventos/processar")
async def endpoint_processar_eventos(usuario: Usuario = Depends(get_current_user),
                                      db: Session = Depends(get_db)):
    """Processa eventos pendentes manualmente"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    await processar_eventos(db)
    
    return {"mensagem": "Eventos processados com sucesso"}


@app.get("/admin/eventos/listar")
def endpoint_listar_eventos(processados: bool = False,
                            usuario: Usuario = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """Lista eventos do sistema"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    eventos = db.query(EventoSistema).filter(
        EventoSistema.processado == processados
    ).order_by(EventoSistema.data_registro.desc()).limit(100).all()
    
    return {
        "total": len(eventos),
        "eventos": [{
            "id": e.id,
            "tipo": e.tipo,
            "payload": json.loads(e.payload) if e.payload else {},
            "data_registro": e.data_registro.isoformat(),
            "processado": e.processado
        } for e in eventos]
    }


@app.get("/admin/ia/riscos_renovacao")
def listar_riscos_renovacao(usuario: Usuario = Depends(get_admin_user),
                             db: Session = Depends(get_db)):
    """Lista contratos B2B em risco de não renovação"""
    hoje = datetime.utcnow()
    limite = hoje + timedelta(days=90)
    
    contratos = db.query(Contrato).filter(
        Contrato.unidade_id == usuario.unidade_id,
        Contrato.data_fim <= limite,
        Contrato.data_fim >= hoje,
        Contrato.status == "ativo"
    ).all()
    
    riscos = []
    for c in contratos:
        dias_restantes = (c.data_fim - hoje).days
        risco_percentual = 100 - (dias_restantes / 90 * 100)
        
        usuarios_ativos = db.query(Usuario).filter(
            Usuario.unidade_id == c.unidade_id,
            Usuario.ativo == True
        ).count()
        
        nivel = "CRITICO" if dias_restantes <= 15 else "ALTO" if dias_restantes <= 30 else "MEDIO"
        
        riscos.append({
            "contrato_id": c.id,
            "nome": c.nome,
            "valor_mensal": c.valor_mensal,
            "data_fim": c.data_fim.isoformat(),
            "dias_restantes": dias_restantes,
            "risco_nao_renovacao": round(risco_percentual, 2),
            "nivel": nivel,
            "usuarios_ativos": usuarios_ativos,
            "limite_usuarios": c.limite_usuarios,
            "taxa_uso": round((usuarios_ativos / c.limite_usuarios * 100), 2) if c.limite_usuarios else None
        })
    
    riscos.sort(key=lambda x: x['dias_restantes'])
    
    receita_em_risco = sum([r['valor_mensal'] for r in riscos if r['nivel'] in ['CRITICO', 'ALTO']])
    
    return {
        "total_contratos": len(riscos),
        "criticos": len([r for r in riscos if r['nivel'] == 'CRITICO']),
        "alto_risco": len([r for r in riscos if r['nivel'] == 'ALTO']),
        "medio_risco": len([r for r in riscos if r['nivel'] == 'MEDIO']),
        "receita_mensal_em_risco": receita_em_risco,
        "contratos": riscos
    }


@app.get("/painel/exportar_usuarios_csv")
def exportar_usuarios_csv(usuario: Usuario = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    """Exporta dados de usuários para CSV com análise de risco"""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    usuarios = db.query(Usuario).filter(Usuario.unidade_id == usuario.unidade_id).all()
    
    data = []
    for u in usuarios:
        data.append({
            "ID": u.id,
            "Nome": u.nome,
            "Email": u.email,
            "Tipo": u.tipo,
            "Ativo": "Sim" if u.ativo else "Não",
            "Risco_Churn_%": round(u.risco_churn * 100, 2),
            "Nivel_Risco": "ALTO" if u.risco_churn > 0.75 else "MÉDIO" if u.risco_churn > 0.40 else "BAIXO",
            "Data_Cadastro": u.data_cadastro.strftime("%d/%m/%Y") if u.data_cadastro else "",
            "Ultima_Atividade": u.ultima_atividade.strftime("%d/%m/%Y") if u.ultima_atividade else ""
        })
    
    df = pd.DataFrame(data)
    csv_path = "/tmp/usuarios_viviocrm.csv"
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    
    return FileResponse(
        path=csv_path,
        filename=f"usuarios_viviocrm_{datetime.utcnow().strftime('%Y%m%d')}.csv",
        media_type="text/csv"
    )


# ============================================
# ENDPOINTS DE RELATÓRIOS - PAINEL
# ============================================

@app.get("/relatorios/aulas")
def relatorio_aulas(data_inicio: str = None, data_fim: str = None,
                    usuario: Usuario = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Retorna dados para relatório de aulas"""
    query = db.query(EventoAula).filter(EventoAula.unidade_id == usuario.unidade_id)
    
    if data_inicio:
        query = query.filter(EventoAula.data >= data_inicio)
    if data_fim:
        query = query.filter(EventoAula.data <= data_fim)
    
    aulas = query.all()
    
    total_aulas = len(aulas)
    total_reservas = sum([db.query(ReservaAula).filter(ReservaAula.aula_id == a.id).count() for a in aulas])
    total_presencas = db.query(Attendance).filter(Attendance.status == 'presente').count()
    cancelamentos = db.query(ReservaAula).filter(ReservaAula.status == 'cancelado').count()
    
    taxa_ocupacao = 0
    if aulas:
        capacidade_total = sum([a.capacidade_maxima or 0 for a in aulas])
        if capacidade_total > 0:
            taxa_ocupacao = round((total_reservas / capacidade_total) * 100, 1)
    
    aulas_dados = []
    for a in aulas[:50]:
        instrutor = db.query(Instrutor).filter(Instrutor.id == a.instrutor_id).first()
        sala = db.query(Sala).filter(Sala.id == a.sala_id).first()
        reservas = db.query(ReservaAula).filter(ReservaAula.aula_id == a.id).count()
        presencas = db.query(Attendance).join(ReservaAula).filter(
            ReservaAula.aula_id == a.id,
            Attendance.status == 'presente'
        ).count()
        taxa = round((presencas / reservas * 100), 1) if reservas > 0 else 0
        
        aulas_dados.append({
            "data": a.data.strftime("%d/%m/%Y") if a.data else "",
            "nome": a.nome,
            "instrutor": instrutor.nome if instrutor else "-",
            "sala": sala.nome if sala else "-",
            "reservas": reservas,
            "presencas": presencas,
            "taxa": taxa
        })
    
    return {
        "total_aulas": total_aulas,
        "total_presencas": total_presencas,
        "taxa_ocupacao": taxa_ocupacao,
        "cancelamentos": cancelamentos,
        "aulas": aulas_dados
    }


@app.get("/relatorios/automacao")
def relatorio_automacao(usuario: Usuario = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    """Retorna dados para relatório de automação"""
    jornadas_ativas = db.query(Jornada).filter(
        Jornada.unidade_id == usuario.unidade_id,
        Jornada.ativa == True
    ).count()
    
    grupos_ativos = db.query(Grupo).filter(
        Grupo.unidade_id == usuario.unidade_id,
        Grupo.ativo == True
    ).count()
    
    usuarios_em_jornadas = db.query(UsuarioJornada).join(Jornada).filter(
        Jornada.unidade_id == usuario.unidade_id,
        UsuarioJornada.status == 'em_progresso'
    ).count()
    
    questionarios_total = db.query(Questionario).filter(
        Questionario.unidade_id == usuario.unidade_id
    ).count()
    
    return {
        "jornadas_ativas": jornadas_ativas,
        "questionarios_respondidos": questionarios_total,
        "grupos_ativos": grupos_ativos,
        "usuarios_em_jornadas": usuarios_em_jornadas
    }


@app.get("/relatorios/loja")
def relatorio_loja(usuario: Usuario = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Retorna dados para relatório da loja (estrutura inicial)"""
    return {
        "total_vendas": 0,
        "receita_total": 0,
        "produtos_vendidos": 0,
        "mais_vendido": "-"
    }


@app.get("/relatorios/equipe")
def relatorio_equipe(usuario: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    """Retorna dados para relatório da equipe"""
    instrutores = db.query(Instrutor).filter(
        Instrutor.unidade_id == usuario.unidade_id
    ).all()
    
    total_instrutores = len(instrutores)
    
    aulas_por_instrutor = {}
    for inst in instrutores:
        count = db.query(EventoAula).filter(EventoAula.instrutor_id == inst.id).count()
        aulas_por_instrutor[inst.nome] = count
    
    total_aulas = sum(aulas_por_instrutor.values())
    destaque = max(aulas_por_instrutor, key=aulas_por_instrutor.get) if aulas_por_instrutor else "-"
    
    return {
        "total_instrutores": total_instrutores,
        "horas_trabalhadas": total_aulas * 1,
        "aulas_ministradas": total_aulas,
        "destaque": destaque
    }


@app.get("/relatorios/contratos")
def relatorio_contratos(usuario: Usuario = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    """Retorna dados para relatório de contratos B2B"""
    contratos = db.query(Contrato).filter(
        Contrato.unidade_id == usuario.unidade_id
    ).all()
    
    ativos = [c for c in contratos if c.status == "ativo"]
    receita_mensal = sum([c.valor_mensal for c in ativos])
    
    hoje = datetime.utcnow()
    em_risco = len([c for c in ativos if c.data_fim and (c.data_fim - hoje).days <= 30])
    
    renovacoes = len([c for c in contratos if c.renovacoes and c.renovacoes > 0])
    
    return {
        "contratos_ativos": len(ativos),
        "receita_mensal": receita_mensal,
        "renovacoes": renovacoes,
        "em_risco": em_risco
    }


@app.get("/relatorios/visitantes")
def relatorio_visitantes(usuario: Usuario = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    """Retorna dados para relatório de visitantes/leads"""
    visitantes = db.query(Visitante).filter(
        Visitante.unidade_id == usuario.unidade_id
    ).all()
    
    total_leads = len(visitantes)
    conversoes = len([v for v in visitantes if v.convertido])
    taxa_conversao = round((conversoes / total_leads * 100), 1) if total_leads > 0 else 0
    
    origens = {}
    for v in visitantes:
        origem = v.origem or "Direto"
        origens[origem] = origens.get(origem, 0) + 1
    
    origem_principal = max(origens, key=origens.get) if origens else "-"
    
    return {
        "total_leads": total_leads,
        "conversoes": conversoes,
        "taxa_conversao": taxa_conversao,
        "origem_principal": origem_principal
    }


@app.get("/relatorios/financeiro")
def relatorio_financeiro(usuario: Usuario = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    """Retorna dados para relatório financeiro"""
    contratos = db.query(Contrato).filter(
        Contrato.unidade_id == usuario.unidade_id,
        Contrato.status == "ativo"
    ).all()
    
    receita_b2b = sum([c.valor_mensal for c in contratos])
    receita_b2c = 0
    receita_total = receita_b2b + receita_b2c
    
    return {
        "receita_total": receita_total,
        "receita_b2b": receita_b2b,
        "receita_b2c": receita_b2c,
        "crescimento": 0
    }


@app.get("/relatorios/{tipo}/download")
def download_relatorio(tipo: str, formato: str = "csv",
                       data_inicio: str = None, data_fim: str = None,
                       usuario: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Gera arquivo de download para relatórios"""
    from io import BytesIO, StringIO
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    
    data = []
    headers = []
    titulo = ""
    
    if tipo == "aulas":
        titulo = "Relatório de Aulas"
        headers = ["Data", "Aula", "Instrutor", "Sala", "Reservas", "Presenças", "Taxa"]
        aulas = db.query(EventoAula).filter(EventoAula.unidade_id == usuario.unidade_id).limit(100).all()
        for a in aulas:
            instrutor = db.query(Instrutor).filter(Instrutor.id == a.instrutor_id).first()
            sala = db.query(Sala).filter(Sala.id == a.sala_id).first()
            reservas = db.query(ReservaAula).filter(ReservaAula.aula_id == a.id).count()
            data.append([
                a.data.strftime("%d/%m/%Y") if a.data else "",
                a.nome,
                instrutor.nome if instrutor else "-",
                sala.nome if sala else "-",
                reservas,
                0,
                "0%"
            ])
    
    elif tipo == "automacao":
        titulo = "Relatório de Automação"
        headers = ["Tipo", "Nome", "Status", "Criado em"]
        jornadas = db.query(Jornada).filter(Jornada.unidade_id == usuario.unidade_id).all()
        for j in jornadas:
            data.append([
                "Jornada",
                j.nome,
                "Ativa" if j.ativa else "Inativa",
                j.criado_em.strftime("%d/%m/%Y") if j.criado_em else ""
            ])
    
    elif tipo == "contratos":
        titulo = "Relatório de Contratos"
        headers = ["Nome", "Valor Mensal", "Início", "Fim", "Status", "Limite Usuários"]
        contratos = db.query(Contrato).filter(Contrato.unidade_id == usuario.unidade_id).all()
        for c in contratos:
            data.append([
                c.nome,
                f"R$ {c.valor_mensal:,.2f}",
                c.data_inicio.strftime("%d/%m/%Y") if c.data_inicio else "",
                c.data_fim.strftime("%d/%m/%Y") if c.data_fim else "",
                c.status,
                c.limite_usuarios
            ])
    
    elif tipo == "equipe":
        titulo = "Relatório da Equipe"
        headers = ["Nome", "Email", "Especialidades"]
        instrutores = db.query(Instrutor).filter(Instrutor.unidade_id == usuario.unidade_id).all()
        for i in instrutores:
            data.append([i.nome, i.email, i.especialidades or "-"])
    
    elif tipo == "visitantes":
        titulo = "Relatório de Visitantes"
        headers = ["Nome", "Email", "Telefone", "Origem", "Convertido"]
        visitantes = db.query(Visitante).filter(Visitante.unidade_id == usuario.unidade_id).all()
        for v in visitantes:
            data.append([
                v.nome,
                v.email or "-",
                v.telefone or "-",
                v.origem or "Direto",
                "Sim" if v.convertido else "Não"
            ])
    
    elif tipo == "financeiro":
        titulo = "Relatório Financeiro"
        headers = ["Tipo", "Descrição", "Valor"]
        contratos = db.query(Contrato).filter(
            Contrato.unidade_id == usuario.unidade_id,
            Contrato.status == "ativo"
        ).all()
        for c in contratos:
            data.append(["B2B", c.nome, f"R$ {c.valor_mensal:,.2f}"])
    
    else:
        raise HTTPException(status_code=400, detail="Tipo de relatório não suportado")
    
    if formato == "csv":
        df = pd.DataFrame(data, columns=headers)
        csv_path = f"/tmp/relatorio_{tipo}.csv"
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        
        return FileResponse(
            path=csv_path,
            filename=f"relatorio_{tipo}_{datetime.utcnow().strftime('%Y%m%d')}.csv",
            media_type="text/csv"
        )
    
    elif formato == "pdf":
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        styles = getSampleStyleSheet()
        elements.append(Paragraph(titulo, styles['Heading1']))
        elements.append(Paragraph(f"Gerado em: {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        elements.append(Paragraph("<br/><br/>", styles['Normal']))
        
        table_data = [headers] + data
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2746')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e8e8e8')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f7fa')])
        ]))
        
        elements.append(table)
        doc.build(elements)
        
        buffer.seek(0)
        pdf_path = f"/tmp/relatorio_{tipo}.pdf"
        with open(pdf_path, 'wb') as f:
            f.write(buffer.getvalue())
        
        return FileResponse(
            path=pdf_path,
            filename=f"relatorio_{tipo}_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
            media_type="application/pdf"
        )
    
    raise HTTPException(status_code=400, detail="Formato não suportado")
