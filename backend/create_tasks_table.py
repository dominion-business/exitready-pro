"""
Migration script to create tasks table for task manager
"""
import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'exitready.db')

print(f"Connecting to database: {db_path}")

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tasks table
try:
    print("Creating tasks table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id VARCHAR(100) NOT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'not_started',
            priority VARCHAR(50) DEFAULT 'medium',
            due_date DATE,
            completed_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (question_id) REFERENCES assessment_questions(question_id)
        )
    """)
    conn.commit()
    print("[SUCCESS] Successfully created tasks table")
except sqlite3.Error as e:
    print(f"[ERROR] Error creating tasks table: {e}")

# Create indexes for performance
try:
    print("Creating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_question_id ON tasks(question_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)")
    conn.commit()
    print("[SUCCESS] Successfully created indexes")
except sqlite3.Error as e:
    print(f"[ERROR] Error creating indexes: {e}")

conn.close()
print("\nMigration completed!")
