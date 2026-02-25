import sqlite3
import os

db_path = "database.db"
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(chatsession)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "source_file" not in columns:
        print("Adding source_file column to chatsession table...")
        cursor.execute("ALTER TABLE chatsession ADD COLUMN source_file TEXT")
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column source_file already exists.")
        
    conn.close()
except Exception as e:
    print(f"Error migrating database: {e}")
