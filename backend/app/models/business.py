from datetime import datetime
from app.models import db

class Business(db.Model):
    __tablename__ = 'businesses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Basic info
    name = db.Column(db.String(200), nullable=False)
    industry = db.Column(db.String(100))
    
    # Financial data (keeping for backwards compatibility)
    revenue = db.Column(db.Float)
    ebitda = db.Column(db.Float)
    
    # Business details
    employees = db.Column(db.Integer)
    founded_year = db.Column(db.Integer)
    exit_goal = db.Column(db.String(50))
    
    # New fields
    primary_location = db.Column(db.String(100))
    primary_market = db.Column(db.String(50))
    registration_type = db.Column(db.String(50))
    owners = db.Column(db.Text)  # JSON string of owners array
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_name': self.name,  # Map to business_name for frontend
            'industry': self.industry,
            'revenue': self.revenue,
            'ebitda': self.ebitda,
            'employees': self.employees,
            'year_founded': self.founded_year,  # Map to year_founded for frontend
            'exit_goal': self.exit_goal,
            'primary_location': self.primary_location,
            'primary_market': self.primary_market,
            'registration_type': self.registration_type,
            'owners': self.owners,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Business {self.name}>'