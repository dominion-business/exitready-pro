from app.models import db
from datetime import datetime

class Valuation(db.Model):
    """Store business valuation calculations"""
    __tablename__ = 'valuations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=True)
    
    # Valuation metadata
    valuation_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    method = db.Column(db.String(50), nullable=False)  # 'cca', 'dcf', 'coe', 'nav', 'rot'
    
    # Input data (encrypted JSON)
    input_data = db.Column(db.Text, nullable=False)  # Store all inputs as JSON
    
    # Results
    valuation_amount = db.Column(db.Float, nullable=False)
    low_range = db.Column(db.Float, nullable=True)
    high_range = db.Column(db.Float, nullable=True)
    
    # Additional details (encrypted JSON)
    calculation_details = db.Column(db.Text, nullable=True)  # Detailed breakdown
    assumptions = db.Column(db.Text, nullable=True)  # Assumptions used
    
    # Metadata
    notes = db.Column(db.Text, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('valuations', lazy=True))
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_id': self.business_id,
            'valuation_date': self.valuation_date.isoformat() if self.valuation_date else None,
            'method': self.method,
            'valuation_amount': self.valuation_amount,
            'low_range': self.low_range,
            'high_range': self.high_range,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Valuation {self.id} - {self.method}: ${self.valuation_amount:,.0f}>'


class IndustryMultiple(db.Model):
    """Store industry valuation multiples"""
    __tablename__ = 'industry_multiples'
    
    id = db.Column(db.Integer, primary_key=True)
    industry_name = db.Column(db.String(200), nullable=False, unique=True)
    industry_code = db.Column(db.String(50), nullable=True)
    
    # EV/EBITDA multiples
    ev_ebitda_low = db.Column(db.Float, nullable=True)
    ev_ebitda_median = db.Column(db.Float, nullable=True)
    ev_ebitda_high = db.Column(db.Float, nullable=True)
    
    # EV/Revenue multiples
    ev_revenue_low = db.Column(db.Float, nullable=True)
    ev_revenue_median = db.Column(db.Float, nullable=True)
    ev_revenue_high = db.Column(db.Float, nullable=True)
    
    # P/E multiples (Price to Earnings)
    pe_low = db.Column(db.Float, nullable=True)
    pe_median = db.Column(db.Float, nullable=True)
    pe_high = db.Column(db.Float, nullable=True)
    
    # Rule of Thumb
    rule_of_thumb = db.Column(db.String(500), nullable=True)  # Description of industry rule
    
    # Metadata
    data_source = db.Column(db.String(100), nullable=True)  # e.g., 'NYU Stern', 'Equidam'
    last_updated = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'industry_name': self.industry_name,
            'industry_code': self.industry_code,
            'ev_ebitda': {
                'low': self.ev_ebitda_low,
                'median': self.ev_ebitda_median,
                'high': self.ev_ebitda_high
            },
            'ev_revenue': {
                'low': self.ev_revenue_low,
                'median': self.ev_revenue_median,
                'high': self.ev_revenue_high
            },
            'pe': {
                'low': self.pe_low,
                'median': self.pe_median,
                'high': self.pe_high
            },
            'rule_of_thumb': self.rule_of_thumb,
            'data_source': self.data_source,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
    
    def __repr__(self):
        return f'<IndustryMultiple {self.industry_name}>'