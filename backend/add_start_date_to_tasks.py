"""
Add start_date field to tasks table
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Add start_date column
        with db.engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE tasks
                ADD COLUMN start_date DATE
            """))
            conn.commit()
            print("OK Added start_date column to tasks table")

    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
