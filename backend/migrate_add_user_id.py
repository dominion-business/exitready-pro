"""
Database migration: Add user_id to valuations table
Run this to fix the schema mismatch
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import text

def migrate_valuations_table():
    """Add user_id column to valuations table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if column exists
            result = db.session.execute(text("PRAGMA table_info(valuations)"))
            columns = [row[1] for row in result]
            
            if 'user_id' in columns:
                print("✓ user_id column already exists in valuations table")
                return
            
            print("Adding user_id column to valuations table...")
            
            # SQLite doesn't support ALTER TABLE ADD COLUMN with FOREIGN KEY
            # So we need to recreate the table
            
            # Step 1: Rename old table
            db.session.execute(text("ALTER TABLE valuations RENAME TO valuations_old"))
            
            # Step 2: Create new table with correct schema
            db.session.execute(text("""
                CREATE TABLE valuations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    business_id INTEGER,
                    valuation_date DATETIME NOT NULL,
                    method VARCHAR(50) NOT NULL,
                    input_data TEXT,
                    valuation_amount FLOAT NOT NULL,
                    low_range FLOAT,
                    high_range FLOAT,
                    calculation_details TEXT,
                    assumptions TEXT,
                    notes TEXT,
                    is_archived BOOLEAN DEFAULT 0,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (business_id) REFERENCES businesses(id)
                )
            """))
            
            # Step 3: Copy data from old table (if any exists)
            # Try to infer user_id from business_id
            db.session.execute(text("""
                INSERT INTO valuations 
                    (id, user_id, business_id, valuation_date, method, input_data, 
                     valuation_amount, low_range, high_range, calculation_details, 
                     assumptions, notes, is_archived, created_at, updated_at)
                SELECT 
                    v.id,
                    COALESCE(b.user_id, 1) as user_id,
                    v.business_id,
                    v.valuation_date,
                    v.method,
                    v.input_data,
                    v.valuation_amount,
                    v.low_range,
                    v.high_range,
                    v.calculation_details,
                    v.assumptions,
                    v.notes,
                    v.is_archived,
                    v.created_at,
                    v.updated_at
                FROM valuations_old v
                LEFT JOIN businesses b ON v.business_id = b.id
            """))
            
            # Step 4: Drop old table
            db.session.execute(text("DROP TABLE valuations_old"))
            
            db.session.commit()
            
            print("✓ Successfully added user_id column to valuations table")
            print("✓ Migrated existing data")
            
        except Exception as e:
            db.session.rollback()
            print(f"✗ Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_valuations_table()
    print("\n✓ Database migration complete!")
