from metavida_app import SessionLocal, Contrato, Jornada, EtapaJornada, Unidade
from datetime import datetime, timedelta
import json

print("=" * 60)
print("🚀 Populando Contratos e Jornadas de Renovação B2B")
print("=" * 60)

db = SessionLocal()

unidade = db.query(Unidade).first()
if not unidade:
    print("❌ Nenhuma unidade encontrada. Execute o sistema primeiro.")
    exit(1)

unidade_id = unidade.id

contratos_exemplo = [
    {
        "nome": "Contrato Corporativo - TechCorp Brasil",
        "data_inicio": datetime.utcnow() - timedelta(days=300),
        "data_fim": datetime.utcnow() + timedelta(days=65),
        "valor_mensal": 15000.0,
        "limite_usuarios": 150,
        "status": "ativo"
    },
    {
        "nome": "Contrato Wellness - Startup Inovação",
        "data_inicio": datetime.utcnow() - timedelta(days=200),
        "data_fim": datetime.utcnow() + timedelta(days=20),
        "valor_mensal": 8500.0,
        "limite_usuarios": 50,
        "status": "ativo"
    },
    {
        "nome": "Contrato Premium - Multinacional XYZ",
        "data_inicio": datetime.utcnow() - timedelta(days=150),
        "data_fim": datetime.utcnow() + timedelta(days=10),
        "valor_mensal": 25000.0,
        "limite_usuarios": 300,
        "status": "ativo"
    }
]

print("\n📝 Criando contratos corporativos...")
for dados in contratos_exemplo:
    contrato_existente = db.query(Contrato).filter(Contrato.nome == dados["nome"]).first()
    if not contrato_existente:
        contrato = Contrato(**dados, unidade_id=unidade_id)
        db.add(contrato)
        db.commit()
        db.refresh(contrato)
        dias_restantes = (contrato.data_fim - datetime.utcnow()).days
        print(f"✅ Contrato criado: {contrato.nome}")
        print(f"   - Valor mensal: R$ {contrato.valor_mensal:,.2f}")
        print(f"   - Expira em: {dias_restantes} dias")
    else:
        print(f"⚠️  Contrato já existe: {dados['nome']}")

print("\n📝 Criando Jornada de Renovação de Contratos...")
jornada_existente = db.query(Jornada).filter(
    Jornada.nome == "Renovação de Contrato Corporativo").first()

if jornada_existente:
    print(f"⚠️  Jornada já existe: {jornada_existente.nome}")
else:
    jornada = Jornada(
        nome="Renovação de Contrato Corporativo",
        descricao="Jornada automatizada para renovação de contratos B2B antes do vencimento",
        gatilho_evento="CONTRATO_EXPIRANDO",
        ativa=True,
        unidade_id=unidade_id,
        criado_por_id=1
    )
    db.add(jornada)
    db.commit()
    db.refresh(jornada)
    print(f"✅ Jornada criada com ID: {jornada.id}")
    
    etapas = [
        {
            "nome": "Alerta 60 dias - Email para Gerente de Conta",
            "ordem": 1,
            "acao_tipo": "ENVIAR_EMAIL",
            "acao_config": json.dumps({
                "destinatario_tipo": "gerente_conta",
                "assunto": "Alerta: Contrato corporativo expira em 60 dias",
                "template": "renovacao_60_dias",
                "dados": {"prazo": "60 dias"}
            })
        },
        {
            "nome": "Alerta 30 dias - Email para Cliente e Tarefa",
            "ordem": 2,
            "acao_tipo": "ENVIAR_EMAIL",
            "acao_config": json.dumps({
                "destinatario_tipo": "contato_principal",
                "assunto": "Renovação de Contrato - 30 dias",
                "template": "renovacao_30_dias",
                "dados": {"prazo": "30 dias", "urgencia": "media"}
            })
        },
        {
            "nome": "Criar Tarefa para Equipe Comercial",
            "ordem": 3,
            "acao_tipo": "CRIAR_TAREFA",
            "acao_config": json.dumps({
                "titulo": "Contato urgente - Renovação de contrato",
                "descricao": "Contrato expira em breve. Entrar em contato imediato.",
                "prioridade": "alta",
                "responsavel_tipo": "comercial"
            })
        },
        {
            "nome": "Alerta 15 dias - Notificação Crítica",
            "ordem": 4,
            "acao_tipo": "ENVIAR_EMAIL",
            "acao_config": json.dumps({
                "destinatario_tipo": "todos",
                "assunto": "URGENTE: Contrato expira em 15 dias",
                "template": "renovacao_urgente",
                "dados": {"prazo": "15 dias", "urgencia": "critica"}
            })
        }
    ]
    
    for etapa_dados in etapas:
        etapa = EtapaJornada(**etapa_dados, jornada_id=jornada.id)
        db.add(etapa)
        db.commit()
        print(f"✅ Etapa {etapa.ordem} criada: {etapa.nome}")
    
    print(f"\n🎉 Jornada 'Renovação de Contrato Corporativo' criada com sucesso!")
    print(f"   - ID: {jornada.id}")
    print(f"   - Gatilho: {jornada.gatilho_evento}")
    print(f"   - Etapas: {len(etapas)}")
    print(f"   - Status: {'Ativa' if jornada.ativa else 'Inativa'}")

print("\n" + "=" * 60)
print("✅ Todos os contratos e jornadas foram criados com sucesso!")
print("=" * 60)

db.close()
