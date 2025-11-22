#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para popular jornadas de exemplo no banco de dados
"""
import sqlite3
import json
from datetime import datetime

def criar_jornada_onboarding():
    """Cria jornada de onboarding para novos usuários"""
    conn = sqlite3.connect("gym_wellness.db")
    cursor = conn.cursor()
    
    # Criar jornada de onboarding
    cursor.execute("""
        INSERT INTO jornadas (nome, descricao, gatilho_evento, ativa, unidade_id, data_criacao, data_atualizacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        "Onboarding Aluno Novo",
        "Jornada automática de boas-vindas e integração para novos alunos",
        "USUARIO_CRIADO",
        1,  # ativa
        1,  # unidade_id
        datetime.utcnow().isoformat(),
        datetime.utcnow().isoformat()
    ))
    
    jornada_id = cursor.lastrowid
    print(f"✅ Jornada criada com ID: {jornada_id}")
    
    # Etapa 1: Enviar email de boas-vindas
    cursor.execute("""
        INSERT INTO etapas_jornada (jornada_id, nome, ordem, acao_tipo, acao_config)
        VALUES (?, ?, ?, ?, ?)
    """, (
        jornada_id,
        "Enviar Email de Boas-Vindas",
        1,
        "ENVIAR_EMAIL",
        json.dumps({
            "assunto": "Bem-vindo ao VIVIO CRM! 🎉",
            "corpo": "Olá {usuario_nome},\n\nSeja muito bem-vindo(a) à nossa academia! Estamos muito felizes em tê-lo(a) conosco.\n\nSeu cadastro foi realizado com sucesso e você já pode começar a aproveitar todos os nossos serviços.\n\nQualquer dúvida, estamos à disposição!\n\nAtenciosamente,\nEquipe VIVIO"
        })
    ))
    print("✅ Etapa 1 criada: Enviar Email de Boas-Vindas")
    
    # Etapa 2: Criar tarefa de acompanhamento
    cursor.execute("""
        INSERT INTO etapas_jornada (jornada_id, nome, ordem, acao_tipo, acao_config)
        VALUES (?, ?, ?, ?, ?)
    """, (
        jornada_id,
        "Criar Tarefa de Acompanhamento",
        2,
        "CRIAR_TAREFA",
        json.dumps({
            "titulo": "Fazer contato com novo aluno",
            "descricao": "Ligar ou enviar mensagem para verificar se o aluno teve uma boa primeira experiência e oferecer ajuda para montar o treino inicial."
        })
    ))
    print("✅ Etapa 2 criada: Criar Tarefa de Acompanhamento")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Jornada 'Onboarding Aluno Novo' criada com sucesso!")
    print(f"   - ID: {jornada_id}")
    print(f"   - Gatilho: USUARIO_CRIADO")
    print(f"   - Etapas: 2")
    print(f"   - Status: Ativa")


def criar_jornada_retencao_churn():
    """Cria jornada de retenção para usuários com risco de churn"""
    conn = sqlite3.connect("gym_wellness.db")
    cursor = conn.cursor()
    
    # Criar jornada de retenção
    cursor.execute("""
        INSERT INTO jornadas (nome, descricao, gatilho_evento, ativa, unidade_id, data_criacao, data_atualizacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        "Retenção - Alto Risco de Churn",
        "Jornada automática para engajar usuários com alto risco de abandono",
        "CHURN_ALERTA",
        1,  # ativa
        1,  # unidade_id
        datetime.utcnow().isoformat(),
        datetime.utcnow().isoformat()
    ))
    
    jornada_id = cursor.lastrowid
    print(f"✅ Jornada criada com ID: {jornada_id}")
    
    # Etapa 1: Criar grupo de alto risco
    cursor.execute("""
        INSERT INTO etapas_jornada (jornada_id, nome, ordem, acao_tipo, acao_config)
        VALUES (?, ?, ?, ?, ?)
    """, (
        jornada_id,
        "Adicionar ao Grupo Alto Risco",
        1,
        "CRIAR_GRUPO",
        json.dumps({
            "nome_grupo": "Alto Risco de Churn (IA)",
            "descricao": "Usuários identificados pela IA com alta probabilidade de cancelamento",
            "cor": "#e74c3c"
        })
    ))
    print("✅ Etapa 1 criada: Adicionar ao Grupo Alto Risco")
    
    # Etapa 2: Enviar email de reengajamento
    cursor.execute("""
        INSERT INTO etapas_jornada (jornada_id, nome, ordem, acao_tipo, acao_config)
        VALUES (?, ?, ?, ?, ?)
    """, (
        jornada_id,
        "Enviar Email de Reengajamento",
        2,
        "ENVIAR_EMAIL",
        json.dumps({
            "assunto": "Sentimos sua falta! Oferta especial para você 💪",
            "corpo": "Olá {usuario_nome},\n\nPercebemos que você não tem vindo à academia nos últimos dias e queremos te ajudar a retomar sua rotina de treinos!\n\nQue tal voltarmos juntos? Temos uma oferta especial preparada especialmente para você:\n\n🎁 3 aulas grátis com personal trainer\n🎁 Avaliação física completa sem custo\n🎁 Plano de treino personalizado\n\nVamos juntos nessa jornada! Entre em contato conosco para agendar.\n\nAtenciosamente,\nEquipe VIVIO"
        })
    ))
    print("✅ Etapa 2 criada: Enviar Email de Reengajamento")
    
    # Etapa 3: Criar tarefa para o gerente
    cursor.execute("""
        INSERT INTO etapas_jornada (jornada_id, nome, ordem, acao_tipo, acao_config)
        VALUES (?, ?, ?, ?, ?)
    """, (
        jornada_id,
        "Criar Tarefa para Contato do Gerente",
        3,
        "CRIAR_TAREFA",
        json.dumps({
            "titulo": "Ligar para aluno em risco de churn",
            "descricao": "Entrar em contato pessoalmente com o aluno para entender os motivos da ausência e oferecer soluções personalizadas."
        })
    ))
    print("✅ Etapa 3 criada: Criar Tarefa para Contato do Gerente")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Jornada 'Retenção - Alto Risco de Churn' criada com sucesso!")
    print(f"   - ID: {jornada_id}")
    print(f"   - Gatilho: CHURN_ALERTA")
    print(f"   - Etapas: 3")
    print(f"   - Status: Ativa")


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Populando Jornadas de Exemplo")
    print("=" * 60)
    print()
    
    print("📝 Criando jornada: Onboarding Aluno Novo...")
    criar_jornada_onboarding()
    
    print()
    print("📝 Criando jornada: Retenção - Alto Risco de Churn...")
    criar_jornada_retencao_churn()
    
    print()
    print("=" * 60)
    print("✅ Todas as jornadas foram criadas com sucesso!")
    print("=" * 60)
