"""
Seed database with industry valuation multiples
Data sources: NYU Stern, Equidam, industry research
"""

INDUSTRY_MULTIPLES = [
    # Technology & Software
    {
        'industry_name': 'Software (Enterprise/Infrastructure)',
        'industry_code': 'TECH-SW-ENT',
        'ev_ebitda_low': 12.0,
        'ev_ebitda_median': 18.0,
        'ev_ebitda_high': 25.0,
        'ev_revenue_low': 3.0,
        'ev_revenue_median': 6.0,
        'ev_revenue_high': 10.0,
        'pe_low': 15.0,
        'pe_median': 25.0,
        'pe_high': 40.0,
        'rule_of_thumb': '4-8x ARR for SaaS, higher for high-growth',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Software (System & Application)',
        'industry_code': 'TECH-SW-APP',
        'ev_ebitda_low': 10.0,
        'ev_ebitda_median': 15.0,
        'ev_ebitda_high': 22.0,
        'ev_revenue_low': 2.5,
        'ev_revenue_median': 5.0,
        'ev_revenue_high': 8.0,
        'pe_low': 12.0,
        'pe_median': 20.0,
        'pe_high': 35.0,
        'rule_of_thumb': '3-6x revenue, adjust for growth rate and churn',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Internet Software & Services',
        'industry_code': 'TECH-INT',
        'ev_ebitda_low': 11.0,
        'ev_ebitda_median': 17.0,
        'ev_ebitda_high': 24.0,
        'ev_revenue_low': 2.0,
        'ev_revenue_median': 4.5,
        'ev_revenue_high': 7.5,
        'pe_low': 14.0,
        'pe_median': 22.0,
        'pe_high': 35.0,
        'rule_of_thumb': '2-5x revenue for web services',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Semiconductors',
        'industry_code': 'TECH-SEMI',
        'ev_ebitda_low': 9.0,
        'ev_ebitda_median': 14.0,
        'ev_ebitda_high': 20.0,
        'ev_revenue_low': 2.0,
        'ev_revenue_median': 3.5,
        'ev_revenue_high': 6.0,
        'pe_low': 12.0,
        'pe_median': 18.0,
        'pe_high': 28.0,
        'rule_of_thumb': '2-4x revenue, higher for specialized chips',
        'data_source': 'NYU Stern 2024'
    },
    
    # Healthcare
    {
        'industry_name': 'Healthcare Services',
        'industry_code': 'HLTH-SVC',
        'ev_ebitda_low': 8.0,
        'ev_ebitda_median': 12.0,
        'ev_ebitda_high': 16.0,
        'ev_revenue_low': 0.8,
        'ev_revenue_median': 1.5,
        'ev_revenue_high': 2.5,
        'pe_low': 10.0,
        'pe_median': 15.0,
        'pe_high': 22.0,
        'rule_of_thumb': '0.5-2x revenue, higher for specialized services',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Medical Devices & Equipment',
        'industry_code': 'HLTH-DEV',
        'ev_ebitda_low': 10.0,
        'ev_ebitda_median': 15.0,
        'ev_ebitda_high': 20.0,
        'ev_revenue_low': 1.5,
        'ev_revenue_median': 2.8,
        'ev_revenue_high': 4.5,
        'pe_low': 12.0,
        'pe_median': 18.0,
        'pe_high': 26.0,
        'rule_of_thumb': '2-4x revenue for device manufacturers',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Pharmaceutical & Biotech',
        'industry_code': 'HLTH-PHARMA',
        'ev_ebitda_low': 11.0,
        'ev_ebitda_median': 16.0,
        'ev_ebitda_high': 22.0,
        'ev_revenue_low': 2.5,
        'ev_revenue_median': 4.0,
        'ev_revenue_high': 6.5,
        'pe_low': 14.0,
        'pe_median': 20.0,
        'pe_high': 30.0,
        'rule_of_thumb': '3-6x revenue, heavily dependent on pipeline',
        'data_source': 'NYU Stern 2024'
    },
    
    # Manufacturing
    {
        'industry_name': 'Manufacturing - Machinery',
        'industry_code': 'MFG-MACH',
        'ev_ebitda_low': 6.0,
        'ev_ebitda_median': 9.0,
        'ev_ebitda_high': 13.0,
        'ev_revenue_low': 0.6,
        'ev_revenue_median': 1.0,
        'ev_revenue_high': 1.6,
        'pe_low': 8.0,
        'pe_median': 12.0,
        'pe_high': 17.0,
        'rule_of_thumb': '0.5-1.5x revenue plus equipment value',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Manufacturing - Auto Parts',
        'industry_code': 'MFG-AUTO',
        'ev_ebitda_low': 5.0,
        'ev_ebitda_median': 7.5,
        'ev_ebitda_high': 11.0,
        'ev_revenue_low': 0.4,
        'ev_revenue_median': 0.7,
        'ev_revenue_high': 1.2,
        'pe_low': 6.0,
        'pe_median': 10.0,
        'pe_high': 14.0,
        'rule_of_thumb': '0.4-1x revenue, adjust for supplier relationships',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Manufacturing - Food & Beverage',
        'industry_code': 'MFG-FOOD',
        'ev_ebitda_low': 7.0,
        'ev_ebitda_median': 10.0,
        'ev_ebitda_high': 14.0,
        'ev_revenue_low': 0.5,
        'ev_revenue_median': 0.9,
        'ev_revenue_high': 1.4,
        'pe_low': 8.0,
        'pe_median': 12.0,
        'pe_high': 16.0,
        'rule_of_thumb': '0.5-1.2x revenue plus inventory',
        'data_source': 'BizBuySell 2024'
    },
    
    # Retail & Consumer
    {
        'industry_name': 'Retail - General',
        'industry_code': 'RETAIL-GEN',
        'ev_ebitda_low': 5.0,
        'ev_ebitda_median': 8.0,
        'ev_ebitda_high': 11.0,
        'ev_revenue_low': 0.3,
        'ev_revenue_median': 0.5,
        'ev_revenue_high': 0.8,
        'pe_low': 6.0,
        'pe_median': 10.0,
        'pe_high': 14.0,
        'rule_of_thumb': '0.25-0.6x revenue plus inventory at cost',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'E-commerce',
        'industry_code': 'RETAIL-ECOM',
        'ev_ebitda_low': 8.0,
        'ev_ebitda_median': 12.0,
        'ev_ebitda_high': 18.0,
        'ev_revenue_low': 0.5,
        'ev_revenue_median': 1.2,
        'ev_revenue_high': 2.5,
        'pe_low': 10.0,
        'pe_median': 15.0,
        'pe_high': 25.0,
        'rule_of_thumb': '1-2.5x revenue for established brands',
        'data_source': 'Equidam 2024'
    },
    {
        'industry_name': 'Restaurants & Food Service',
        'industry_code': 'FOOD-REST',
        'ev_ebitda_low': 4.0,
        'ev_ebitda_median': 6.0,
        'ev_ebitda_high': 9.0,
        'ev_revenue_low': 0.25,
        'ev_revenue_median': 0.4,
        'ev_revenue_high': 0.7,
        'pe_low': 5.0,
        'pe_median': 8.0,
        'pe_high': 12.0,
        'rule_of_thumb': '0.3-0.5x revenue plus equipment, lower for franchises',
        'data_source': 'BizBuySell 2024'
    },
    
    # Professional Services
    {
        'industry_name': 'Accounting & Tax Services',
        'industry_code': 'PROF-ACCT',
        'ev_ebitda_low': 5.0,
        'ev_ebitda_median': 7.0,
        'ev_ebitda_high': 10.0,
        'ev_revenue_low': 0.6,
        'ev_revenue_median': 1.0,
        'ev_revenue_high': 1.5,
        'pe_low': 6.0,
        'pe_median': 9.0,
        'pe_high': 13.0,
        'rule_of_thumb': '0.75-1.25x revenue, higher for recurring clients',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Legal Services',
        'industry_code': 'PROF-LEGAL',
        'ev_ebitda_low': 5.0,
        'ev_ebitda_median': 7.5,
        'ev_ebitda_high': 11.0,
        'ev_revenue_low': 0.5,
        'ev_revenue_median': 0.9,
        'ev_revenue_high': 1.4,
        'pe_low': 6.0,
        'pe_median': 9.0,
        'pe_high': 14.0,
        'rule_of_thumb': '0.6-1.2x revenue, depends on client retention',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Consulting Services',
        'industry_code': 'PROF-CONSULT',
        'ev_ebitda_low': 6.0,
        'ev_ebitda_median': 9.0,
        'ev_ebitda_high': 13.0,
        'ev_revenue_low': 0.7,
        'ev_revenue_median': 1.2,
        'ev_revenue_high': 1.8,
        'pe_low': 7.0,
        'pe_median': 11.0,
        'pe_high': 16.0,
        'rule_of_thumb': '0.8-1.5x revenue for established practices',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Marketing & Advertising',
        'industry_code': 'PROF-MARKET',
        'ev_ebitda_low': 6.0,
        'ev_ebitda_median': 9.0,
        'ev_ebitda_high': 13.0,
        'ev_revenue_low': 0.5,
        'ev_revenue_median': 1.0,
        'ev_revenue_high': 1.8,
        'pe_low': 7.0,
        'pe_median': 11.0,
        'pe_high': 16.0,
        'rule_of_thumb': '0.75-1.5x revenue, digital agencies command premium',
        'data_source': 'BizBuySell 2024'
    },
    
    # Construction & Real Estate
    {
        'industry_name': 'Construction - General Contractor',
        'industry_code': 'CONST-GEN',
        'ev_ebitda_low': 4.0,
        'ev_ebitda_median': 6.0,
        'ev_ebitda_high': 9.0,
        'ev_revenue_low': 0.3,
        'ev_revenue_median': 0.5,
        'ev_revenue_high': 0.8,
        'pe_low': 5.0,
        'pe_median': 7.0,
        'pe_high': 11.0,
        'rule_of_thumb': '0.4-0.7x revenue plus equipment at market value',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Real Estate Services',
        'industry_code': 'RE-SVC',
        'ev_ebitda_low': 7.0,
        'ev_ebitda_median': 10.0,
        'ev_ebitda_high': 14.0,
        'ev_revenue_low': 0.8,
        'ev_revenue_median': 1.3,
        'ev_revenue_high': 2.0,
        'pe_low': 8.0,
        'pe_median': 12.0,
        'pe_high': 17.0,
        'rule_of_thumb': '1-2x revenue for property management firms',
        'data_source': 'BizBuySell 2024'
    },
    
    # Transportation & Logistics
    {
        'industry_name': 'Transportation - Trucking',
        'industry_code': 'TRANS-TRUCK',
        'ev_ebitda_low': 3.5,
        'ev_ebitda_median': 5.5,
        'ev_ebitda_high': 8.0,
        'ev_revenue_low': 0.3,
        'ev_revenue_median': 0.5,
        'ev_revenue_high': 0.8,
        'pe_low': 4.0,
        'pe_median': 6.5,
        'pe_high': 10.0,
        'rule_of_thumb': '0.4-0.7x revenue plus fleet value',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Logistics & Supply Chain',
        'industry_code': 'TRANS-LOG',
        'ev_ebitda_low': 6.0,
        'ev_ebitda_median': 9.0,
        'ev_ebitda_high': 13.0,
        'ev_revenue_low': 0.4,
        'ev_revenue_median': 0.7,
        'ev_revenue_high': 1.2,
        'pe_low': 7.0,
        'pe_median': 10.0,
        'pe_high': 15.0,
        'rule_of_thumb': '0.5-1x revenue, depends on contracts',
        'data_source': 'NYU Stern 2024'
    },
    
    # Hospitality & Tourism
    {
        'industry_name': 'Hotels & Lodging',
        'industry_code': 'HOSP-HOTEL',
        'ev_ebitda_low': 8.0,
        'ev_ebitda_median': 11.0,
        'ev_ebitda_high': 15.0,
        'ev_revenue_low': 1.5,
        'ev_revenue_median': 2.5,
        'ev_revenue_high': 4.0,
        'pe_low': 10.0,
        'pe_median': 14.0,
        'pe_high': 20.0,
        'rule_of_thumb': '2-4x EBITDA or per-room valuations',
        'data_source': 'HVS 2024'
    },
    
    # Financial Services
    {
        'industry_name': 'Insurance Agencies',
        'industry_code': 'FIN-INS',
        'ev_ebitda_low': 6.0,
        'ev_ebitda_median': 8.5,
        'ev_ebitda_high': 12.0,
        'ev_revenue_low': 1.2,
        'ev_revenue_median': 2.0,
        'ev_revenue_high': 3.0,
        'pe_low': 7.0,
        'pe_median': 10.0,
        'pe_high': 15.0,
        'rule_of_thumb': '1.5-3x revenue (commissions), higher for books of business',
        'data_source': 'BizBuySell 2024'
    },
    {
        'industry_name': 'Wealth Management',
        'industry_code': 'FIN-WEALTH',
        'ev_ebitda_low': 7.0,
        'ev_ebitda_median': 10.0,
        'ev_ebitda_high': 14.0,
        'ev_revenue_low': 1.5,
        'ev_revenue_median': 2.5,
        'ev_revenue_high': 4.0,
        'pe_low': 8.0,
        'pe_median': 12.0,
        'pe_high': 17.0,
        'rule_of_thumb': '2-4x revenue (AUM fees), depends on client retention',
        'data_source': 'BizBuySell 2024'
    },
    
    # Education
    {
        'industry_name': 'Education & Training Services',
        'industry_code': 'EDU-TRAIN',
        'ev_ebitda_low': 5.0,
        'ev_ebitda_median': 7.5,
        'ev_ebitda_high': 11.0,
        'ev_revenue_low': 0.5,
        'ev_revenue_median': 1.0,
        'ev_revenue_high': 1.6,
        'pe_low': 6.0,
        'pe_median': 9.0,
        'pe_high': 13.0,
        'rule_of_thumb': '0.75-1.5x revenue for private schools/training centers',
        'data_source': 'BizBuySell 2024'
    },
    
    # Energy
    {
        'industry_name': 'Oil & Gas',
        'industry_code': 'ENERGY-OG',
        'ev_ebitda_low': 4.0,
        'ev_ebitda_median': 6.0,
        'ev_ebitda_high': 9.0,
        'ev_revenue_low': 0.4,
        'ev_revenue_median': 0.7,
        'ev_revenue_high': 1.2,
        'pe_low': 5.0,
        'pe_median': 8.0,
        'pe_high': 12.0,
        'rule_of_thumb': 'Asset-based valuations plus reserves',
        'data_source': 'NYU Stern 2024'
    },
    {
        'industry_name': 'Renewable Energy',
        'industry_code': 'ENERGY-RENEW',
        'ev_ebitda_low': 8.0,
        'ev_ebitda_median': 12.0,
        'ev_ebitda_high': 17.0,
        'ev_revenue_low': 1.0,
        'ev_revenue_median': 2.0,
        'ev_revenue_high': 3.5,
        'pe_low': 10.0,
        'pe_median': 15.0,
        'pe_high': 23.0,
        'rule_of_thumb': '2-3x revenue for solar/wind projects',
        'data_source': 'NYU Stern 2024'
    },
]


def seed_industry_multiples(db, IndustryMultiple):
    """Populate database with industry multiples"""
    
    print("🌱 Seeding industry multiples...")
    
    # Check if data already exists
    existing_count = IndustryMultiple.query.count()
    if existing_count > 0:
        print(f"   Found {existing_count} existing industries")
        response = input("   Clear and re-seed? (y/n): ")
        if response.lower() == 'y':
            IndustryMultiple.query.delete()
            db.session.commit()
            print("   Cleared existing data")
        else:
            print("   Keeping existing data")
            return
    
    # Add all industries
    for industry_data in INDUSTRY_MULTIPLES:
        industry = IndustryMultiple(**industry_data)
        db.session.add(industry)
    
    db.session.commit()
    
    print(f"✅ Successfully seeded {len(INDUSTRY_MULTIPLES)} industries")
    print("\nSample industries:")
    for industry in IndustryMultiple.query.limit(5):
        print(f"   - {industry.industry_name}")


if __name__ == '__main__':
    from app import create_app, db
    from app.models.valuation import IndustryMultiple
    
    app = create_app()
    with app.app_context():
        seed_industry_multiples(db, IndustryMultiple)
