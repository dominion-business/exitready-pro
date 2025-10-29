from datetime import datetime
from app.models import db

class ValuationHistory(db.Model):
    """Store historical valuations for users"""
    __tablename__ = 'valuation_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    valuation_data = db.Column(db.JSON, nullable=False)  # Store full valuation result
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('valuation_history', lazy=True))
    
    def __repr__(self):
        return f'<ValuationHistory {self.id} for User {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'valuation_data': self.valuation_data,
            'created_at': self.created_at.isoformat()
        }
