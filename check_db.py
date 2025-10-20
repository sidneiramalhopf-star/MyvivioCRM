#!/usr/bin/env python3
"""
Simple script to check and display database contents
"""
import sqlite3
import sys

def main():
    try:
        conn = sqlite3.connect('gym_wellness.db')
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        print("=== DATABASE TABLES ===")
        for table in tables:
            table_name = table[0]
            print(f"\n📋 Table: {table_name}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   Rows: {count}")
            
            # Show first few rows if any exist
            if count > 0 and table_name in ['usuarios', 'unidades', 'programas']:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                rows = cursor.fetchall()
                
                # Get column names
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = [col[1] for col in cursor.fetchall()]
                
                print(f"   Columns: {', '.join(columns)}")
                print(f"   Sample data:")
                for row in rows:
                    print(f"      {row}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
