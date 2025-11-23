"""
Migração manual para adicionar suporte B2B ao banco de dados existente
"""
import sqlite3
import os

print("=" * 60)
print("🔄 Migrando banco de dados para suporte B2B")
print("=" * 60)

db_path = "gym_wellness.db"

if not os.path.exists(db_path):
    print(f"❌ Banco de dados não encontrado: {db_path}")
    print("Execute o sistema primeiro para criar o banco.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def column_exists(table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cursor.fetchall()]
    return column_name in columns

try:
    print("\n1️⃣ Verificando e adicionando coluna 'tipo_unidade' na tabela 'unidades'...")
    if not column_exists('unidades', 'tipo_unidade'):
        cursor.execute("ALTER TABLE unidades ADD COLUMN tipo_unidade VARCHAR DEFAULT 'B2C'")
        print("   ✅ Coluna 'tipo_unidade' adicionada")
    else:
        print("   ⚠️  Coluna 'tipo_unidade' já existe")
    
    print("\n2️⃣ Verificando e adicionando colunas B2B na tabela 'visitantes'...")
    if not column_exists('visitantes', 'tipo_lead'):
        cursor.execute("ALTER TABLE visitantes ADD COLUMN tipo_lead VARCHAR DEFAULT 'Individual'")
        print("   ✅ Coluna 'tipo_lead' adicionada")
    else:
        print("   ⚠️  Coluna 'tipo_lead' já existe")
    
    if not column_exists('visitantes', 'empresa'):
        cursor.execute("ALTER TABLE visitantes ADD COLUMN empresa VARCHAR")
        print("   ✅ Coluna 'empresa' adicionada")
    else:
        print("   ⚠️  Coluna 'empresa' já existe")
    
    print("\n3️⃣ Verificando tabela 'contratos'...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='contratos'")
    if not cursor.fetchone():
        print("   ℹ️  Tabela 'contratos' não existe, será criada automaticamente pelo SQLAlchemy")
    else:
        print("   ✅ Tabela 'contratos' já existe")
    
    conn.commit()
    print("\n" + "=" * 60)
    print("✅ Migração concluída com sucesso!")
    print("=" * 60)
    
except Exception as e:
    conn.rollback()
    print(f"\n❌ Erro durante migração: {e}")
    exit(1)
finally:
    conn.close()
