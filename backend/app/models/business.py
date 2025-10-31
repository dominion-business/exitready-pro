from datetime import datetime
from app.models import db

class Business(db.Model):
    __tablename__ = 'businesses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Client Personal Information
    client_first_name = db.Column(db.String(100))
    client_last_name = db.Column(db.String(100))
    client_email = db.Column(db.String(200))
    client_phone = db.Column(db.String(50))
    client_date_of_birth = db.Column(db.Date)
    client_address = db.Column(db.String(300))
    client_city = db.Column(db.String(100))
    client_state = db.Column(db.String(50))
    client_zip = db.Column(db.String(20))

    # Spouse/Partner Information
    spouse_name = db.Column(db.String(200))
    spouse_email = db.Column(db.String(200))
    spouse_phone = db.Column(db.String(50))
    spouse_involved_in_business = db.Column(db.Boolean, default=False)

    # Family & Dependents
    num_dependents = db.Column(db.Integer)
    dependents_info = db.Column(db.Text)  # JSON array of dependent details

    # Basic business info
    name = db.Column(db.String(200), nullable=False)  # Business name
    industry = db.Column(db.String(100))
    
    # Financial data (keeping for backwards compatibility)
    revenue = db.Column(db.Float)
    ebitda = db.Column(db.Float)
    
    # Business details
    employees = db.Column(db.Integer)
    founded_year = db.Column(db.Integer)
    exit_goal = db.Column(db.String(50))

    # Location and market
    primary_location = db.Column(db.String(100))
    primary_market = db.Column(db.String(50))
    registration_type = db.Column(db.String(50))
    owners = db.Column(db.Text)  # JSON string of owners array

    # Exit planning fields
    exit_horizon = db.Column(db.String(50))  # 0-2 years, 2-5 years, 5-10 years, 10+ years
    preferred_exit_type = db.Column(db.String(100))  # Strategic sale, PE sale, Family succession, etc.
    key_motivations = db.Column(db.Text)  # JSON array of motivations
    deal_breakers = db.Column(db.Text)  # JSON array of deal breakers

    # Strategic assets
    has_proprietary_tech = db.Column(db.Boolean, default=False)
    has_patents_ip = db.Column(db.Boolean, default=False)
    has_recurring_revenue = db.Column(db.Boolean, default=False)
    recurring_revenue_percentage = db.Column(db.Float)

    # Financials detail
    gross_margin = db.Column(db.Float)
    growth_rate = db.Column(db.Float)  # Annual revenue growth rate
    customer_concentration = db.Column(db.String(50))  # Low, Medium, High

    # Succession & team
    has_management_team = db.Column(db.Boolean, default=False)
    successor_identified = db.Column(db.Boolean, default=False)
    successor_type = db.Column(db.String(50))  # Family, Management, External, None

    # Advisory team
    has_attorney = db.Column(db.Boolean, default=False)
    has_accountant = db.Column(db.Boolean, default=False)
    has_financial_advisor = db.Column(db.Boolean, default=False)
    has_exit_advisor = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            # Client Personal Information
            'client_first_name': self.client_first_name,
            'client_last_name': self.client_last_name,
            'client_email': self.client_email,
            'client_phone': self.client_phone,
            'client_date_of_birth': self.client_date_of_birth.isoformat() if self.client_date_of_birth else None,
            'client_address': self.client_address,
            'client_city': self.client_city,
            'client_state': self.client_state,
            'client_zip': self.client_zip,
            # Spouse/Partner Information
            'spouse_name': self.spouse_name,
            'spouse_email': self.spouse_email,
            'spouse_phone': self.spouse_phone,
            'spouse_involved_in_business': self.spouse_involved_in_business,
            # Family & Dependents
            'num_dependents': self.num_dependents,
            'dependents_info': self.dependents_info,
            # Business Information
            'business_name': self.name,
            'industry': self.industry,
            'revenue': self.revenue,
            'ebitda': self.ebitda,
            'employees': self.employees,
            'year_founded': self.founded_year,
            'exit_goal': self.exit_goal,
            'primary_location': self.primary_location,
            'primary_market': self.primary_market,
            'registration_type': self.registration_type,
            'owners': self.owners,
            # Exit planning fields
            'exit_horizon': self.exit_horizon,
            'preferred_exit_type': self.preferred_exit_type,
            'key_motivations': self.key_motivations,
            'deal_breakers': self.deal_breakers,
            # Strategic assets
            'has_proprietary_tech': self.has_proprietary_tech,
            'has_patents_ip': self.has_patents_ip,
            'has_recurring_revenue': self.has_recurring_revenue,
            'recurring_revenue_percentage': self.recurring_revenue_percentage,
            # Financials
            'gross_margin': self.gross_margin,
            'growth_rate': self.growth_rate,
            'customer_concentration': self.customer_concentration,
            # Succession & team
            'has_management_team': self.has_management_team,
            'successor_identified': self.successor_identified,
            'successor_type': self.successor_type,
            # Advisory team
            'has_attorney': self.has_attorney,
            'has_accountant': self.has_accountant,
            'has_financial_advisor': self.has_financial_advisor,
            'has_exit_advisor': self.has_exit_advisor,
            # Timestamps
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Business {self.name}>'