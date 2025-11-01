"""
Initialize Supabase PostgreSQL Database with all tables
This script creates all tables from SQLAlchemy models
"""
import os
import sys

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Business, Assessment, Valuation, ValuationHistory, WealthGap, ExitQuizResponse, Task

def init_database():
    """Initialize the database by creating all tables"""
    app = create_app()

    with app.app_context():
        print("=" * 60)
        print("Initializing Supabase PostgreSQL Database")
        print("=" * 60)

        # Get database URL (hide password)
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        if '@' in db_url:
            parts = db_url.split('@')
            safe_url = parts[0].split(':')[0] + ':****@' + parts[1]
        else:
            safe_url = db_url
        print(f"\nDatabase: {safe_url}")

        try:
            # Create all tables
            print("\nCreating tables...")
            db.create_all()

            # List all tables
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()

            print("\n✅ Successfully created the following tables:")
            for table in sorted(tables):
                print(f"   - {table}")

            print(f"\nTotal tables created: {len(tables)}")

            # Check for any existing data
            print("\n" + "=" * 60)
            print("Table Status:")
            print("=" * 60)

            table_stats = []

            # User table
            user_count = db.session.query(User).count()
            table_stats.append(('users', user_count))

            # Business table
            business_count = db.session.query(Business).count()
            table_stats.append(('businesses', business_count))

            # Assessment table
            assessment_count = db.session.query(Assessment).count()
            table_stats.append(('assessments', assessment_count))

            # Valuation table
            valuation_count = db.session.query(Valuation).count()
            table_stats.append(('valuations', valuation_count))

            # ValuationHistory table
            history_count = db.session.query(ValuationHistory).count()
            table_stats.append(('valuation_history', history_count))

            # WealthGap table
            wealth_gap_count = db.session.query(WealthGap).count()
            table_stats.append(('wealth_gaps', wealth_gap_count))

            # ExitQuizResponse table
            exit_quiz_count = db.session.query(ExitQuizResponse).count()
            table_stats.append(('exit_quiz_responses', exit_quiz_count))

            # Task table
            task_count = db.session.query(Task).count()
            table_stats.append(('tasks', task_count))

            for table_name, count in table_stats:
                status = "✅ Ready" if count == 0 else f"📊 {count} records"
                print(f"{table_name:20s} {status}")

            print("\n" + "=" * 60)
            print("Database Initialization Complete!")
            print("=" * 60)
            print("\nYour Supabase PostgreSQL database is ready to use.")
            print("All tables have been created and are accessible from:")
            print("https://supabase.com/dashboard/project/nxrszkxayqgoyxohngfz")

            print("\n" + "=" * 60)
            print("About Row Level Security (RLS):")
            print("=" * 60)
            print("Supabase warns about RLS because it's designed for direct client access.")
            print("Since your app uses a backend API (Flask), you can:")
            print("  1. Keep RLS disabled (your Flask app controls access)")
            print("  2. Or enable RLS policies for additional security")
            print("\nFor now, RLS disabled is fine - your Flask authentication handles security.")

        except Exception as e:
            print(f"\n❌ Error creating tables: {e}")
            import traceback
            traceback.print_exc()
            return False

        return True

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
