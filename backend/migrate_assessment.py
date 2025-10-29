from app import create_app, db
from sqlalchemy import text, inspect

app = create_app()

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

with app.app_context():
    print("🔄 Starting database migration...")
    print("-" * 50)
    
    # Add assessment_type column
    if not column_exists('assessments', 'assessment_type'):
        try:
            db.session.execute(text(
                "ALTER TABLE assessments ADD COLUMN assessment_type VARCHAR(50) DEFAULT 'attractiveness'"
            ))
            db.session.commit()
            print('✅ Added assessment_type column')
        except Exception as e:
            print(f'⚠️  Error adding assessment_type: {e}')
            db.session.rollback()
    else:
        print('ℹ️  assessment_type column already exists')
    
    # Add attractiveness_score column
    if not column_exists('assessments', 'attractiveness_score'):
        try:
            db.session.execute(text(
                "ALTER TABLE assessments ADD COLUMN attractiveness_score FLOAT DEFAULT 0.0"
            ))
            db.session.commit()
            print('✅ Added attractiveness_score column')
        except Exception as e:
            print(f'⚠️  Error adding attractiveness_score: {e}')
            db.session.rollback()
    else:
        print('ℹ️  attractiveness_score column already exists')
    
    # Add readiness_score column
    if not column_exists('assessments', 'readiness_score'):
        try:
            db.session.execute(text(
                "ALTER TABLE assessments ADD COLUMN readiness_score FLOAT DEFAULT 0.0"
            ))
            db.session.commit()
            print('✅ Added readiness_score column')
        except Exception as e:
            print(f'⚠️  Error adding readiness_score: {e}')
            db.session.rollback()
    else:
        print('ℹ️  readiness_score column already exists')
    
    # Add all 10 category score columns
    categories = [
        'financial_performance_score',
        'revenue_quality_score',
        'customer_concentration_score',
        'management_team_score',
        'competitive_position_score',
        'growth_potential_score',
        'intellectual_property_score',
        'legal_compliance_score',
        'owner_dependency_score',
        'strategic_positioning_score'
    ]
    
    print("\nAdding category score columns...")
    print("-" * 50)
    
    for category in categories:
        if not column_exists('assessments', category):
            try:
                db.session.execute(text(
                    f"ALTER TABLE assessments ADD COLUMN {category} FLOAT DEFAULT 0.0"
                ))
                db.session.commit()
                print(f'✅ Added {category}')
            except Exception as e:
                print(f'⚠️  Error adding {category}: {e}')
                db.session.rollback()
        else:
            print(f'ℹ️  {category} already exists')
    
    # Update existing assessments to have assessment_type = 'attractiveness'
    print("\nUpdating existing assessments...")
    print("-" * 50)
    try:
        result = db.session.execute(text(
            "UPDATE assessments SET assessment_type = 'attractiveness' WHERE assessment_type IS NULL"
        ))
        db.session.commit()
        print(f'✅ Updated {result.rowcount} existing assessments with attractiveness type')
    except Exception as e:
        print(f'⚠️  Error updating existing assessments: {e}')
        db.session.rollback()
    
    print("\n" + "=" * 50)
    print("🎉 Database migration complete!")
    print("=" * 50)
    
    # Show summary
    print("\nDatabase Summary:")
    inspector = inspect(db.engine)
    columns = inspector.get_columns('assessments')
    print(f"Total columns in assessments table: {len(columns)}")
    
    from app.models.assessment import Assessment
    count = Assessment.query.count()
    print(f"Total assessments in database: {count}")