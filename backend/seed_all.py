"""Seed all baseline data without emoji output"""
from app import create_app, db
from app.models.valuation import IndustryMultiple
from app.models.assessment import AssessmentTask
import seed_industries

app = create_app()

with app.app_context():
    # Seed industry multiples
    for industry_data in seed_industries.INDUSTRY_MULTIPLES:
        existing = IndustryMultiple.query.filter_by(industry_name=industry_data['industry_name']).first()
        if not existing:
            industry = IndustryMultiple(**industry_data)
            db.session.add(industry)

    db.session.commit()

    print(f"Seeded {IndustryMultiple.query.count()} industry multiples")
    print("Done!")
